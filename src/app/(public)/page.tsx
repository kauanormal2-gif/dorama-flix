import { prisma } from "@/lib/db";
import { SELECAO_CARD, SELECAO_DESTAQUE } from "@/lib/movie-select";
import HomeClient from "./HomeClient";

// Tira acento e caixa alta pra busca não depender de "gênia" vs "genia".
function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const category = params.category || "";

  const where: Record<string, unknown> = { status: "active" };
  if (category) where.categories = { some: { category: { slug: category } } };

  const [allMovies, categories, featuredMovies] = await Promise.all([
    prisma.movie.findMany({
      where,
      // A descrição vem só pra busca rodar aqui no servidor; ela é descartada
      // antes de ir pro navegador (ver `movies` logo abaixo).
      select: { ...SELECAO_CARD, description: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.movie.findMany({
      where: { featured: true, status: "active" },
      select: SELECAO_DESTAQUE,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Busca por palavras soltas: cada termo pode aparecer em qualquer ordem, no
  // título, na descrição ou na categoria — ignorando acento e maiúscula.
  const terms = normalize(search.trim()).split(/\s+/).filter(Boolean);
  let movies = allMovies;

  if (terms.length) {
    const phrase = terms.join(" ");
    const scored: { movie: (typeof allMovies)[number]; score: number }[] = [];

    for (const m of allMovies) {
      const title = normalize(m.title);
      const haystack = normalize(
        `${m.title} ${m.description ?? ""} ${m.categories
          .map((c) => c.category.name)
          .join(" ")}`
      );
      if (!terms.every((t) => haystack.includes(t))) continue;

      // Título vale mais que descrição, pra o resultado mais óbvio vir primeiro.
      let score = 0;
      if (title.startsWith(phrase)) score = 3;
      else if (title.includes(phrase)) score = 2;
      else if (terms.every((t) => title.includes(t))) score = 1;

      scored.push({ movie: m, score });
    }

    scored.sort((a, b) => b.score - a.score);
    movies = scored.map((s) => s.movie);
  }

  // Tira a sinopse antes de mandar pro navegador: a grade não usa, e com ~180
  // séries isso sozinho representava megabytes em toda visita.
  const moviesLeves = movies.map(({ description: _sinopse, ...resto }) => resto);

  return (
    <HomeClient
      movies={moviesLeves}
      categories={categories}
      featuredMovies={featuredMovies}
      search={search}
      activeCategory={category}
    />
  );
}
