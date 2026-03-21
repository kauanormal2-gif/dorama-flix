import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import MovieDetailClient from "./MovieDetailClient";

export default async function MoviePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const movie = await prisma.movie.findFirst({
    where: { slug, status: "active" },
    include: { categories: { include: { category: true } } },
  });

  if (!movie) notFound();

  // Track view
  await prisma.movieAnalytics.create({
    data: { movieId: movie.id, eventType: "view" },
  });

  // Related movies (same categories)
  const categoryIds = movie.categories.map((c) => c.categoryId);
  const related = await prisma.movie.findMany({
    where: {
      id: { not: movie.id },
      status: "active",
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    include: { categories: { include: { category: true } } },
    take: 10,
  });

  return <MovieDetailClient movie={movie} related={related} />;
}
