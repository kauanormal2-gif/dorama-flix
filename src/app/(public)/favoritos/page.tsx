import { prisma } from "@/lib/db";
import { SELECAO_CARD } from "@/lib/movie-select";
import FavoritosClient from "./FavoritosClient";

export default async function FavoritosPage() {
  const movies = await prisma.movie.findMany({
    where: { status: "active" },
    select: SELECAO_CARD,
    orderBy: { createdAt: "desc" },
  });

  return <FavoritosClient movies={movies} />;
}
