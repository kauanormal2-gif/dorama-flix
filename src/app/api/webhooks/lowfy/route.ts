import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWebhookSecret } from "@/lib/webhook-auth";

// Extrai email do payload do Lowfy (tenta vários caminhos comuns)
function extractEmail(body: Record<string, unknown>): string | null {
  const paths = [
    body?.customer,
    body?.buyer,
    body?.subscriber,
    body?.data && (body.data as Record<string, unknown>)?.customer,
    body?.data && (body.data as Record<string, unknown>)?.buyer,
    body?.data && (body.data as Record<string, unknown>)?.subscriber,
  ];

  for (const obj of paths) {
    const o = obj as Record<string, unknown> | undefined;
    if (o?.email && typeof o.email === "string") return o.email;
  }

  if (body?.email && typeof body.email === "string") return body.email;
  return null;
}

function extractName(body: Record<string, unknown>): string | null {
  const paths = [
    body?.customer,
    body?.buyer,
    body?.subscriber,
    body?.data && (body.data as Record<string, unknown>)?.customer,
  ];
  for (const obj of paths) {
    const o = obj as Record<string, unknown> | undefined;
    if (o?.name && typeof o.name === "string") return o.name;
  }
  return null;
}

function isCancellation(event: string): boolean {
  const cancelEvents = ["cancelled", "canceled", "refunded", "chargeback", "expired", "inactive"];
  return cancelEvents.some((e) => event?.toLowerCase().includes(e));
}

export async function POST(req: NextRequest) {
  if (!checkWebhookSecret(req, "WEBHOOK_SECRET_LOWFY")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Log para debug (ver no Vercel Logs)
  console.log("[Lowfy Webhook]", JSON.stringify(body, null, 2));

  const email = extractEmail(body);
  if (!email) {
    console.warn("[Lowfy Webhook] Email não encontrado no payload");
    return NextResponse.json({ ok: true, warning: "email_not_found" });
  }

  const event = (body?.event as string) || "";
  const cancelled = isCancellation(event);

  if (cancelled) {
    await prisma.user.updateMany({
      where: { email: email.toLowerCase() },
      data: { subscriptionStatus: "inactive", subscriptionPlatform: "lowfy" },
    });
    console.log(`[Lowfy Webhook] Assinatura cancelada: ${email}`);
  } else {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 35);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user) {
      await prisma.user.update({
        where: { email: email.toLowerCase() },
        data: {
          subscriptionStatus: "active",
          subscriptionPlatform: "lowfy",
          subscriptionExpiresAt: expiresAt,
        },
      });
      console.log(`[Lowfy Webhook] Assinatura ativada: ${email}`);
    } else {
      // Cria usuário pré-ativado (vai definir senha no primeiro login)
      const name = extractName(body) || email.split("@")[0];
      await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: "",
          subscriptionStatus: "active",
          subscriptionPlatform: "lowfy",
          subscriptionExpiresAt: expiresAt,
        },
      });
      console.log(`[Lowfy Webhook] Novo usuário criado e ativado: ${email}`);
    }
  }

  return NextResponse.json({ ok: true });
}
