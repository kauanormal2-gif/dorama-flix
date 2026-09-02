import { prisma } from "@/lib/db";
import { SELECAO_CARD } from "@/lib/movie-select";
import BuscarClient from "./BuscarClient";

export default async function BuscarPage() {
  const [movies, categories] = await Promise.all([
    prisma.movie.findMany({
      where: { status: "active" },
      // Aqui a sinopse fica: a busca desta tela roda no navegador e procura
      // também dentro do texto da série.
      select: { ...SELECAO_CARD, description: true },
      orderBy: { title: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return <BuscarClient movies={movies} categories={categories} />;
}
