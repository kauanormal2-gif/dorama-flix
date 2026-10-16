import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// Arquivos de rota só podem exportar os handlers, então a lista fica local.
const DURACOES = [3, 7, 14, 30, 90, 365];

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokens = await prisma.guestToken.findMany({
    orderBy: { createdAt: "desc" },
    include: { movie: { select: { title: true, slug: true } } },
  });

  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, durationDays, movieId, prazoRolante } = await req.json();

  if (!label || !durationDays) {
    return NextResponse.json({ error: "label e durationDays são obrigatórios" }, { status: 400 });
  }

  const days = Number(durationDays);
  if (!DURACOES.includes(days)) {
    return NextResponse.json(
      { error: `durationDays deve ser ${DURACOES.join(", ")}` },
      { status: 400 }
    );
  }

  // Convite preso a uma série. Confere que ela existe e está no ar, senão o
  // link nasce apontando pra lugar nenhum.
  let serieId: string | null = null;
  if (movieId) {
    const serie = await prisma.movie.findFirst({
      where: { id: String(movieId), status: "active" },
      select: { id: true },
    });
    if (!serie) {
      return NextResponse.json(
        { error: "Série não encontrada ou fora do ar" },
        { status: 400 }
      );
    }
    serieId = serie.id;
  }

  const token = randomUUID().replace(/-/g, "");

  // Prazo rolante: o LINK não vence (expiresAt vazio) e cada pessoa que abrir
  // ganha `days` dias contados da abertura dela. É o que permite mandar o
  // mesmo link pra quantas pessoas quiser.
  const rolante = Boolean(prazoRolante);
  const expiresAt = rolante ? null : new Date(Date.now() + days * 86400000);

  const guestToken = await prisma.guestToken.create({
    data: {
      token,
      label,
      durationDays: days,
      expiresAt,
      diasDeAcesso: rolante ? days : null,
      movieId: serieId,
    },
    include: { movie: { select: { title: true, slug: true } } },
  });

  return NextResponse.json({ token: guestToken });
}
