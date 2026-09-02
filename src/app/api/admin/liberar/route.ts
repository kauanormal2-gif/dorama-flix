import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEquipe } from "@/lib/equipe-server";
import { activateSubscription } from "@/lib/subscription";
import { getPlan, type PlanKey } from "@/lib/plans";

/**
 * Liberação manual de acesso, feita pelo painel.
 *
 * Existe porque tem cliente que paga por fora (Pix direto, indicação, cortesia)
 * ou trava no checkout — e antes disso a única saída era rodar script na mão.
 */
export async function POST(req: Request) {
  try {
    await requireEquipe();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const plano = body?.plano;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
  }

  if (plano === "vitalicio") {
    const existente = await prisma.user.findUnique({ where: { email } });
    const dados = {
      subscriptionStatus: "active",
      subscriptionPlatform: "manual",
      subscriptionExpiresAt: null,
    };
    const user = existente
      ? await prisma.user.update({ where: { email }, data: dados })
      : await prisma.user.create({
          data: { email, name: email.split("@")[0], password: "", ...dados },
        });
    return NextResponse.json({
      email: user.email,
      criada: !existente,
      venceEm: null,
    });
  }

  if (!getPlan(plano)) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const jaExistia = await prisma.user.findUnique({ where: { email } });
  const venceEm = await activateSubscription({
    email,
    name: "",
    plan: plano as PlanKey,
    platform: "manual",
  });

  return NextResponse.json({
    email,
    criada: !jaExistia,
    venceEm: venceEm.toISOString(),
  });
}
