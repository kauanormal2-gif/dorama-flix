import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const movie = await prisma.movie.findFirst({
    where: { OR: [{ id }, { slug: id }], status: "active" },
    include: { categories: { include: { category: true } } },
  });

  if (!movie) {
    return NextResponse.json({ error: "Filme não encontrado" }, { status: 404 });
  }

  // Track view
  await prisma.movieAnalytics.create({
    data: { movieId: movie.id, eventType: "view" },
  });

  return NextResponse.json({ movie });
}
