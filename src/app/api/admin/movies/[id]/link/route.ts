import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEquipe } from "@/lib/equipe-server";
import { randomUUID } from "crypto";

/**
 * Link fixo de divulgação de uma série.
 *
 * Sempre devolve o MESMO link pra mesma série: se ela já tem um, reaproveita.
 * Assim o link que ela já mandou no zap continua valendo pra sempre — criar um
 * novo a cada clique quebraria os que já estão na rua.
 *
 * Sem validade de propósito: a pessoa assiste a série inteira à vontade, e no
 * fim o próprio site oferece a assinatura.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireEquipe();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const movie = await prisma.movie.findUnique({
    where: { id },
    select: { id: true, title: true, slug: true, status: true },
  });

  if (!movie) {
    return NextResponse.json({ error: "Série não encontrada" }, { status: 404 });
  }
  if (movie.status !== "active") {
    return NextResponse.json(
      { error: "Publique a série antes de gerar o link" },
      { status: 400 }
    );
  }

  const existente = await prisma.guestToken.findFirst({
    where: { movieId: movie.id, expiresAt: null, active: true },
    orderBy: { createdAt: "asc" },
  });

  if (existente) {
    return NextResponse.json({ token: existente.token, novo: false });
  }

  const criado = await prisma.guestToken.create({
    data: {
      token: randomUUID().replace(/-/g, ""),
      label: `Divulgação — ${movie.title.trim()}`,
      durationDays: 0,
      expiresAt: null,
      movieId: movie.id,
    },
  });

  return NextResponse.json({ token: criado.token, novo: true });
}
