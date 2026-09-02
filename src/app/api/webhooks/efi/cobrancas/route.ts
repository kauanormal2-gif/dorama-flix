import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNotification } from "@/lib/efi";
import { settlePayment } from "@/lib/subscription";

export const runtime = "nodejs";

/** Status da API de Cobranças que significam pagamento confirmado */
const PAID = new Set(["paid", "settled"]);
/** Status que invalidam a cobrança */
const FAILED = new Set(["unpaid", "canceled", "refunded", "contested", "expired"]);

/**
 * Notificação da API de Cobranças (boleto e cartão).
 *
 * A Efí envia apenas um token; os dados reais são buscados na API, o que também
 * serve de autenticação — um POST forjado com token inválido não faz nada.
 */
export async function POST(req: NextRequest) {
  let token = "";

  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await req.json();
      token = typeof body?.notification === "string" ? body.notification : "";
    } else {
      const form = await req.formData();
      token = String(form.get("notification") ?? "");
    }
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!token) return NextResponse.json({ ok: true });

  try {
    const entries = await getNotification(token);
    // A última entrada é o estado mais recente da cobrança
    const latest = entries[entries.length - 1];
    if (!latest?.custom_id) return NextResponse.json({ ok: true });

    const payment = await prisma.payment.findUnique({
      where: { id: latest.custom_id },
    });
    if (!payment) {
      console.warn(`[Efí Cobranças] custom_id desconhecido: ${latest.custom_id}`);
      return NextResponse.json({ ok: true });
    }

    const status = latest.status.current;

    if (PAID.has(status)) {
      const result = await settlePayment(payment.id);
      if (!result.alreadyPaid) {
        console.log(
          `[Efí Cobranças] Assinatura ativada: ${payment.email} (${payment.plan}/${payment.method})`
        );
      }
    } else if (FAILED.has(status) && payment.status !== "paid") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: status === "refunded" ? "refunded" : "failed" },
      });
    }
  } catch (error) {
    console.error("[Efí Cobranças] Falha ao processar notificação:", error);
  }

  return NextResponse.json({ ok: true });
}
