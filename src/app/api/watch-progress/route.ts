import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();

  // Visitante sem login continua só com o localStorage — não é erro.
  if (!user) return NextResponse.json({ saved: false });

  try {
    const { slug, timestamp, progress, completed } = await request.json();

    if (typeof slug !== "string" || !slug) {
      return NextResponse.json({ error: "slug obrigatório" }, { status: 400 });
    }

    const movie = await prisma.movie.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!movie) {
      return NextResponse.json({ error: "Filme não encontrado" }, { status: 404 });
    }

    const pct = Math.min(100, Math.max(0, Number(progress) || 0));
    const secs = Math.max(0, Number(timestamp) || 0);
    const done = completed === true || pct >= 90;

    await prisma.watchProgress.upsert({
      where: { userId_movieId: { userId: user.id, movieId: movie.id } },
      create: {
        userId: user.id,
        movieId: movie.id,
        progress: pct,
        timestamp: secs,
        completed: done,
      },
      update: { progress: pct, timestamp: secs, completed: done },
    });

    return NextResponse.json({ saved: true });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
