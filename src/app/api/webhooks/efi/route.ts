import { NextResponse } from "next/server";

/**
 * URL base cadastrada como webhook do Pix na Efí.
 * A Efí valida essa URL no momento do cadastro e depois envia as notificações
 * para /api/webhooks/efi/pix (ela acrescenta "/pix" automaticamente).
 */
export async function POST() {
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
