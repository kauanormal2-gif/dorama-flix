import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPixCharge } from "@/lib/efi";
import { settlePayment } from "@/lib/subscription";

export const runtime = "nodejs";

/**
 * Consulta o status de uma cobrança Pix.
 * Além do banco, reconsulta a Efí — assim o acesso libera mesmo se o webhook falhar.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ txid: string }> }
) {
  const { txid } = await params;

  const payment = await prisma.payment.findUnique({ where: { txid } });
  if (!payment) {
    return NextResponse.json({ error: "Cobrança não encontrada" }, { status: 404 });
  }

  if (payment.status === "paid") {
    return NextResponse.json({ status: "paid", email: payment.email });
  }

  try {
    const charge = await getPixCharge(txid);
    if (charge.status === "CONCLUIDA") {
      await settlePayment(payment.id);
      return NextResponse.json({ status: "paid", email: payment.email });
    }
    if (charge.status === "REMOVIDA_PELO_USUARIO_RECEBEDOR") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "expired" },
      });
      return NextResponse.json({ status: "expired" });
    }
  } catch (error) {
    console.error("[Efí Pix] Falha ao consultar cobrança:", error);
  }

  return NextResponse.json({ status: "pending" });
}
