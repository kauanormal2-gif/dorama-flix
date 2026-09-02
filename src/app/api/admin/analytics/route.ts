import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEquipe } from "@/lib/equipe-server";

export async function GET() {
  try {
    await requireEquipe();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [totalMovies, draftMovies, totalUsers, totalViews, totalFavorites, recentAnalytics] =
    await Promise.all([
      // Só o que está no ar: rascunho e inativo ninguém consegue assistir.
      prisma.movie.count({ where: { status: "active" } }),
      prisma.movie.count({ where: { status: { not: "active" } } }),
      prisma.user.count(),
      prisma.movieAnalytics.count({ where: { eventType: "view" } }),
      prisma.favorite.count(),
      prisma.movieAnalytics.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: { movie: { select: { title: true } } },
      }),
    ]);

  return NextResponse.json({
    stats: { totalMovies, draftMovies, totalUsers, totalViews, totalFavorites },
    recentAnalytics,
  });
}
