import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const [totalMovies, totalUsers, totalViews, totalFavorites, recentAnalytics] =
    await Promise.all([
      prisma.movie.count(),
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
    stats: { totalMovies, totalUsers, totalViews, totalFavorites },
    recentAnalytics,
  });
}
