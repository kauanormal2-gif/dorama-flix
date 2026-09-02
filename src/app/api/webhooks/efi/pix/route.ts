import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPixCharge } from "@/lib/efi";
import { settlePayment } from "@/lib/subscription";

export const runtime = "nodejs";

/**
 * Webhook de Pix recebido da Efí.
 *
 * A Efí acrescenta "/pix" na URL cadastrada, então o endpoint registrado é
 * /api/webhooks/efi e as notificações chegam aqui.
 *
 * Como a Vercel não valida o certificado do cliente (mTLS), a autenticidade
 * NÃO é assumida: cada txid recebido é reconsultado direto na API da Efí antes
 * de liberar qualquer acesso. Uma notificação forjada não ativa nada.
 */
export async function POST(req: NextRequest) {
  let body: { pix?: { txid: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const notifications = Array.isArray(body?.pix) ? body.pix : [];

  for (const item of notifications) {
    if (!item?.txid) continue;

    try {
      const charge = await getPixCharge(item.txid);
      if (charge.status !== "CONCLUIDA") continue;

      const payment = await prisma.payment.findUnique({
        where: { txid: item.txid },
      });
      if (!payment) {
        console.warn(`[Efí Pix Webhook] txid sem pagamento local: ${item.txid}`);
        continue;
      }

      const result = await settlePayment(payment.id);
      if (!result.alreadyPaid) {
        console.log(
          `[Efí Pix Webhook] Assinatura ativada: ${payment.email} (${payment.plan})`
        );
      }
    } catch (error) {
      console.error(`[Efí Pix Webhook] Falha no txid ${item.txid}:`, error);
    }
  }

  return NextResponse.json({ ok: true });
}

/** A Efí valida a URL com uma chamada antes de salvar o webhook. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
