import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isSubscriptionActive } from "@/lib/auth";
import { signToken } from "@/lib/tokens";
import { SECURE_COOKIE_DEFAULTS } from "@/lib/cookies";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidEmail } from "@/lib/validation";

const UM_ANO = 60 * 60 * 24 * 365;

/**
 * Entrada da assinante: só o e-mail, sem senha — decisão da dona do site pra
 * facilitar a vida do público (mulheres, várias idosas).
 *
 * CONSEQUÊNCIA ACEITA: quem souber o e-mail de uma assinante entra na conta
 * dela. O que dá pra segurar aqui é o resto:
 *  - admin NUNCA entra por aqui (o painel continua exigindo senha em /admin/login);
 *  - só entra e-mail com assinatura ativa;
 *  - rate limit por IP pra não virar varredura de e-mails.
 */
export async function POST(request: Request) {
  try {
    const ip = getClientIp(request.headers);
    const rl = await rateLimit(`entrar:${ip}`, 20, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em alguns minutos." },
        { status: 429 }
      );
    }

    const { email } = await request.json();
    if (!email || typeof email !== "string" || !isValidEmail(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Admin tem painel e catálogo na mão — essa porta sem senha não serve pra ele.
    if (!user || user.role === "admin" || !isSubscriptionActive(user)) {
      return NextResponse.json(
        {
          error:
            "Não encontramos uma assinatura ativa com esse e-mail. Confira se digitou o mesmo e-mail da compra.",
          precisaAssinar: true,
        },
        { status: 403 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signToken(
      { userId: user.id, email: user.email, role: user.role },
      "365d"
    );

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email },
    });

    response.cookies.set("token", token, {
      ...SECURE_COOKIE_DEFAULTS,
      maxAge: UM_ANO,
    });

    return response;
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
