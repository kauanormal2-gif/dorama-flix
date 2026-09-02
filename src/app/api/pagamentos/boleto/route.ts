import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appOrigin, parseCheckout, parseCpf } from "@/lib/checkout";
import { createBoletoCharge } from "@/lib/efi";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const DAYS_TO_EXPIRE = 3;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = await rateLimit(`boleto:${ip}`, 8, 10 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente de novo em alguns minutos." },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = parseCheckout(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { plan, customer } = parsed.data;

  // A Efí exige o CPF do titular pra emitir boleto.
  const document = parseCpf(body);
  if (!document.ok) {
    return NextResponse.json({ error: document.error }, { status: 400 });
  }

  const expire = new Date();
  expire.setDate(expire.getDate() + DAYS_TO_EXPIRE);

  const payment = await prisma.payment.create({
    data: {
      method: "boleto",
      plan: plan.key,
      amount: plan.amount,
      email: customer.email,
      name: customer.name,
      cpf: document.cpf,
    },
  });

  try {
    const charge = await createBoletoCharge({
      item: `Drama Flix - Plano ${plan.name}`,
      amount: plan.amount,
      customer: {
        name: customer.name,
        cpf: document.cpf,
        email: customer.email,
        phone_number: customer.phone,
      },
      expireAt: expire.toISOString().slice(0, 10),
      notificationUrl: `${appOrigin(req)}/api/webhooks/efi/cobrancas`,
      customId: payment.id,
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        chargeId: String(charge.charge_id),
        checkoutUrl: charge.billet_link || charge.link,
      },
    });

    return NextResponse.json({
      link: charge.billet_link || charge.link,
      pdf: charge.pdf?.charge,
      barcode: charge.barcode,
      expireAt: charge.expire_at,
    });
  } catch (error) {
    console.error("[Efí Boleto] Falha ao criar cobrança:", error);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "failed" },
    });
    return NextResponse.json(
      { error: "Não foi possível gerar o boleto. Tente novamente." },
      { status: 502 }
    );
  }
}
