import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { signToken } from "@/lib/tokens";
import { SECURE_COOKIE_DEFAULTS } from "@/lib/cookies";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: Request) {
  try {
    // 1) Rate limit por IP — protege contra brute force distribuído
    const ip = getClientIp(request.headers);
    const rl = await rateLimit(`login:${ip}`, 10, 15 * 60 * 1000); // 10 tentativas / 15min
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (
      !email ||
      !password ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Mensagem genérica pra evitar user enumeration
    const invalidCreds = () =>
      NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });

    if (!user) return invalidCreds();

    // 2) Account lockout — bloqueia se muitas falhas
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const min = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          error: `Conta temporariamente bloqueada por segurança. Tente novamente em ${min} min.`,
        },
        { status: 429 }
      );
    }

    const valid = await verifyPassword(password, user.password);

    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const shouldLock = attempts >= MAX_FAILED_ATTEMPTS;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: shouldLock
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
            : null,
        },
      });
      return invalidCreds();
    }

    // Sucesso: zera contador e marca último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });

    response.cookies.set("token", token, {
      ...SECURE_COOKIE_DEFAULTS,
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
