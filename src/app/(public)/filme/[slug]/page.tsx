import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { hasAccess, veioDeConvite } from "@/lib/auth";
import { SELECAO_CARD } from "@/lib/movie-select";
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

  // Verifica acesso — passa como prop (página acessível pra todos, só bloqueia o
  // play). Vai com o id da série porque convite de série única só abre a dela.
  const access = await hasAccess(movie.id);

  // Quem chegou por link de divulgação não assina nada ainda — é pra ela que a
  // oferta aparece quando a série termina.
  const convidada = access && (await veioDeConvite(movie.id));

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
    select: SELECAO_CARD,
    take: 10,
  });

  // Sem assinatura, o endereço do vídeo nem sai do servidor. Antes ele ia junto
  // com a página e dava pra assistir de graça só olhando o código-fonte.
  const movieSeguro = access ? movie : { ...movie, videoUrl: "" };

  return (
    <MovieDetailClient
      movie={movieSeguro}
      related={related}
      hasAccess={access}
      convidada={convidada}
    />
  );
}
