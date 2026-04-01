"use client";

import { useState, useEffect } from "react";
import HeroSection from "@/components/HeroSection";
import MovieRow from "@/components/MovieRow";
import Link from "next/link";

interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  bannerUrl?: string | null;
  rating?: number | null;
  year?: number | null;
  featured: boolean;
  categories: { category: { id: string; name: string; slug: string } }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface HomeClientProps {
  movies: Movie[];
  categories: Category[];
  featuredMovies: Movie[];
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
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <Link
            href="/"
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
              !activeCategory
                ? "bg-primary text-white"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
          >
            Todos
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/?category=${cat.slug}`}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition ${
                activeCategory === cat.slug
                  ? "bg-primary text-white"
                  : "bg-white/10 text-gray-300 hover:bg-white/20"
              }`}
            >
              {cat.name}
            </Link>
          ))}
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
      <div className="max-w-7xl mx-auto">
        {movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">Nenhum filme encontrado</p>
            <p className="text-gray-600 text-sm mt-2">
              Tente buscar com outros termos
            </p>
          </div>
        ) : (
          <>
            {/* Continue Watching */}
            {!search && !activeCategory && continueWatching.length > 0 && (
              <MovieRow
                title="Continuar Assistindo"
                movies={continueWatching}
                showProgress
              />
            )}

            {/* Mais Assistidos — logo após Continuar Assistindo */}
            {!search && !activeCategory && maisAssistidos && maisAssistidos.movies.length > 0 && (
              <MovieRow
                title={maisAssistidos.name}
                movies={maisAssistidos.movies}
              />
            )}

            {/* All / Recent */}
            {!activeCategory && (
              <MovieRow title="Adicionados Recentemente" movies={recentMovies} />
            )}

            {/* By category (exceto Mais Assistidos que já foi mostrado acima) */}
            {activeCategory
              ? moviesByCategory
                  .filter((c) => c.slug === activeCategory)
                  .map((cat) => (
                    <MovieRow
                      key={cat.id}
                      title={cat.name}
                      movies={cat.movies}
                    />
                  ))
              : otherCategories.map((cat) => (
                  <MovieRow
                    key={cat.id}
                    title={cat.name}
                    movies={cat.movies}
                  />
                ))}

            {/* Watched */}
            {!search && !activeCategory && watched.length > 0 && (
              <MovieRow title="Assistidos" movies={watched} dimmed />
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-xs mt-8 border-t border-dark-border">
        <p>
          Drama Flix &copy; {new Date().getFullYear()}. Todos os direitos
          reservados.
        </p>
      </footer>
    </div>
  );
}
