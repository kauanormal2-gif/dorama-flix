import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { parseCheckout } from "@/lib/checkout";
import { createPixCharge, getPixQrCode } from "@/lib/efi";
import { toPixValue } from "@/lib/plans";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const PIX_EXPIRES_IN = 30 * 60; // 30 minutos

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const limit = await rateLimit(`pix:${ip}`, 10, 10 * 60 * 1000);
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

  try {
    const charge = await createPixCharge({
      value: toPixValue(plan.amount),
      name: customer.name,
      description: `Drama Flix - Plano ${plan.name}`,
      expiresIn: PIX_EXPIRES_IN,
    });

    const qr = await getPixQrCode(charge.loc.id);

    await prisma.payment.create({
      data: {
        method: "pix",
        plan: plan.key,
        amount: plan.amount,
        email: customer.email,
        name: customer.name,
        txid: charge.txid,
      },
    });

    return NextResponse.json({
      txid: charge.txid,
      copiaECola: charge.pixCopiaECola,
      qrCodeImage: qr.imagemQrcode,
      expiresIn: PIX_EXPIRES_IN,
    });
  } catch (error) {
    console.error("[Efí Pix] Falha ao criar cobrança:", error);
    return NextResponse.json(
      { error: "Não foi possível gerar o Pix. Tente novamente." },
      { status: 502 }
    );
  }
}
