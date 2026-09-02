import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWebhookSecret } from "@/lib/webhook-auth";

function extractEmail(body: Record<string, unknown>): string | null {
  const paths = [
    body?.subscriber,
    body?.customer,
    body?.buyer,
    body?.data && (body.data as Record<string, unknown>)?.subscriber,
    body?.data && (body.data as Record<string, unknown>)?.customer,
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
    body?.subscriber,
    body?.customer,
    body?.data && (body.data as Record<string, unknown>)?.subscriber,
  ];
  for (const obj of paths) {
    const o = obj as Record<string, unknown> | undefined;
    if (o?.name && typeof o.name === "string") return o.name;
  }
  return null;
}

function isCancellation(event: string): boolean {
  const cancelEvents = ["cancelled", "canceled", "refunded", "chargeback", "expired", "inactive", "churned"];
  return cancelEvents.some((e) => event?.toLowerCase().includes(e));
}

export async function POST(req: NextRequest) {
  if (!checkWebhookSecret(req, "WEBHOOK_SECRET_CAKTO")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[Cakto Webhook]", JSON.stringify(body, null, 2));

  const email = extractEmail(body);
  if (!email) {
    console.warn("[Cakto Webhook] Email não encontrado no payload");
    return NextResponse.json({ ok: true, warning: "email_not_found" });
  }

  const event = (body?.event as string) || "";
  const cancelled = isCancellation(event);

  if (cancelled) {
    await prisma.user.updateMany({
      where: { email: email.toLowerCase() },
      data: { subscriptionStatus: "inactive", subscriptionPlatform: "cakto" },
    });
    console.log(`[Cakto Webhook] Assinatura cancelada: ${email}`);
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
          subscriptionPlatform: "cakto",
          subscriptionExpiresAt: expiresAt,
        },
      });
      console.log(`[Cakto Webhook] Assinatura ativada: ${email}`);
    } else {
      const name = extractName(body) || email.split("@")[0];
      await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: "",
          subscriptionStatus: "active",
          subscriptionPlatform: "cakto",
          subscriptionExpiresAt: expiresAt,
        },
      });
      console.log(`[Cakto Webhook] Novo usuário criado e ativado: ${email}`);
    }
  }

  return NextResponse.json({ ok: true });
}
