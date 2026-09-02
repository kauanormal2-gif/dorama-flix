import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

/**
 * Tira o acesso ao painel.
 *
 * Vira cliente comum em vez de apagar a conta: se a pessoa também assinava,
 * apagar levaria junto a assinatura e o histórico dela.
 */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let dona;
  try {
    dona = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (id === dona.id) {
    return NextResponse.json(
      { error: "Você não pode tirar o seu próprio acesso" },
      { status: 400 }
    );
  }

  const alvo = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!alvo) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (alvo.role === "admin") {
    return NextResponse.json(
      { error: "Não dá pra tirar o acesso de outro administrador por aqui" },
      { status: 400 }
    );
  }

  await prisma.user.update({ where: { id }, data: { role: "user" } });
  return NextResponse.json({ ok: true });
}
