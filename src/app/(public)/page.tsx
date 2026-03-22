import { prisma } from "@/lib/db";
import HomeClient from "./HomeClient";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";

  const where: Record<string, unknown> = { status: "active" };
  if (search) where.title = { contains: search };
  if (category) where.categories = { some: { category: { slug: category } } };

  const [movies, categories, featuredMovies] = await Promise.all([
    prisma.movie.findMany({
      where,
      include: { categories: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.movie.findMany({
      where: { featured: true, status: "active" },
      include: { categories: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <HomeClient
      movies={movies}
      categories={categories}
      featuredMovies={featuredMovies}
      search={search}
      activeCategory={category}
    />
  );
}
