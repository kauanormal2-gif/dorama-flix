"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import MovieCard from "@/components/MovieCard";
import Link from "next/link";

/** O que a capinha precisa. Sem sinopse e sem link de vídeo, de propósito. */
interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  rating?: number | null;
  year?: number | null;
  featured: boolean;
  categories: { category: { id: string; name: string; slug: string } }[];
}

/** O destaque do topo mostra sinopse e banner, então recebe os dois a mais. */
interface MovieDestaque extends Movie {
  description: string;
  bannerUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HomeClientProps {
  movies: Movie[];
  categories: Category[];
  featuredMovies: MovieDestaque[];
  search: string;
  activeCategory: string;
}

interface ProgressData {
  timestamp: number;
  progress: number;
  completed: boolean;
  title: string;
  thumbnail: string;
  lastWatched: string;
}

const PROGRESS_KEY = "doramaflix_progress";

export default function HomeClient({
  movies,
  categories,
  featuredMovies,
  search,
  activeCategory,
}: HomeClientProps) {
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);

  useEffect(() => {
    try {
      const all: Record<string, ProgressData> = JSON.parse(
        localStorage.getItem(PROGRESS_KEY) || "{}"
      );

      const inProgress: Movie[] = [];
      const completed: Movie[] = [];

      // Sort by lastWatched descending
      const entries = Object.entries(all).sort(
        (a, b) =>
          new Date(b[1].lastWatched).getTime() -
          new Date(a[1].lastWatched).getTime()
      );

      for (const [slug, data] of entries) {
        const movie = movies.find((m) => m.slug === slug);
        if (!movie) continue;
        if (data.completed) {
          completed.push(movie);
        } else if (data.progress > 2) {
          inProgress.push(movie);
        }
      }

      setContinueWatching(inProgress);
      setWatched(completed);
    } catch {}
  }, [movies]);

  // Categoria especial "Mais Assistidos" — fica antes de tudo
  const maisAssistidosSlug = "mais-assistidos";

  // Group movies by category
  const moviesByCategory = categories
    .map((cat) => ({
      ...cat,
      movies: movies.filter((m) =>
        m.categories.some((c) => c.category.id === cat.id)
      ),
    }))
    .filter((cat) => cat.movies.length > 0);

  const maisAssistidos = moviesByCategory.find(
    (c) => c.slug === maisAssistidosSlug
  );
  const otherCategories = moviesByCategory.filter(
    (c) => c.slug !== maisAssistidosSlug
  );

  const recentMovies = [...movies].slice(0, 20);

  const showHero = featuredMovies.length > 0 && !search && !activeCategory;

  return (
    <div>
      {/* Hero carrossel */}
      {showHero && <HeroSection movies={featuredMovies} />}

      {/* Spacer when no hero */}
      {!showHero && <div className="pt-24" />}

      {/* Category filter */}
      <div className="relative border-b border-white/5 mb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div
            className="flex gap-1 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: "none" }}
          >
            <Link
              href="/"
              className={`flex-shrink-0 relative px-4 py-4 text-sm font-medium transition ${
                !activeCategory
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Todos
              {!activeCategory && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-t" />
              )}
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/?category=${cat.slug}`}
                className={`flex-shrink-0 relative px-4 py-4 text-sm font-medium transition ${
                  activeCategory === cat.slug
                    ? "text-white"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {cat.name}
                {activeCategory === cat.slug && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 bg-primary rounded-t" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Search results label */}
      {search && (
        <div className="max-w-7xl mx-auto px-4 mb-4">
          <p className="text-gray-400 text-sm">
            Resultados para &quot;{search}&quot; — {movies.length} encontrado
            {movies.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto pt-2">
        {movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Nenhum filme encontrado</p>
            <p className="text-gray-600 text-sm mt-2">
              Tente buscar com outros termos
            </p>
          </div>
        ) : (
          <>
            {/* Mais Assistidos — primeira fileira da home */}
            {!search && !activeCategory && maisAssistidos && maisAssistidos.movies.length > 0 && (
              <MovieRow
                title={maisAssistidos.name}
                movies={maisAssistidos.movies}
              />
            )}

            {/* Continue Watching */}
            {!search && !activeCategory && continueWatching.length > 0 && (
              <MovieRow
                title="Continuar Assistindo"
                movies={continueWatching}
                showProgress
              />
            )}

            {/* All / Recent */}
            {!activeCategory && (
              <MovieRow title="Adicionados Recentemente" movies={recentMovies} />
            )}

            {/* Gênero ou busca: grade que preenche a página (rola pra baixo,
                não pro lado). Sem carrossel e sem repetir filme em várias
                fileiras. */}
            {activeCategory || search ? (
              <div className="px-4 md:px-6">
                {activeCategory && (
                  <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-5">
                    {categories.find((c) => c.slug === activeCategory)?.name}
                  </h2>
                )}
                {/* [&>a]:w-full anula a largura fixa do MovieCard pra ele
                    esticar e a grade ocupar a largura toda */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-5 [&>a]:w-full">
                  {movies.map((movie) => (
                    <MovieCard key={movie.id} {...movie} />
                  ))}
                </div>
              </div>
            ) : (
              /* Home: fileiras por categoria (Mais Assistidos já saiu acima) */
              otherCategories.map((cat) => (
                <MovieRow key={cat.id} title={cat.name} movies={cat.movies} />
              ))
            )}

            {/* Watched */}
            {!search && !activeCategory && watched.length > 0 && (
              <MovieRow title="Assistidos" movies={watched} dimmed />
            )}
          </>
        )}
      </div>

    </div>
  );
}
