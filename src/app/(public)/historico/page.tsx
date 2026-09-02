import { prisma } from "@/lib/db";
import { SELECAO_CARD } from "@/lib/movie-select";
import HistoricoClient from "./HistoricoClient";

export default async function HistoricoPage() {
  const movies = await prisma.movie.findMany({
    where: { status: "active" },
    select: SELECAO_CARD,
    orderBy: { createdAt: "desc" },
  });

  return <HistoricoClient movies={movies} />;
}
