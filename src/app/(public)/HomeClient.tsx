"use client";

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
  featuredMovie: Movie | null;
  search: string;
  activeCategory: string;
}

export default function HomeClient({
  movies,
  categories,
  featuredMovie,
  search,
  activeCategory,
}: HomeClientProps) {
  // Group movies by category
  const moviesByCategory = categories
    .map((cat) => ({
      ...cat,
      movies: movies.filter((m) =>
        m.categories.some((c) => c.category.id === cat.id)
      ),
    }))
    .filter((cat) => cat.movies.length > 0);

  const recentMovies = [...movies].slice(0, 20);

  return (
    <div>
      {/* Hero */}
      {featuredMovie && !search && !activeCategory && (
        <HeroSection movie={featuredMovie} />
      )}

      {/* Spacer when no hero */}
      {(!featuredMovie || search || activeCategory) && (
        <div className="pt-24" />
      )}

      {/* Category filter */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
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

      {/* Search results */}
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
            {/* All / Recent */}
            {!activeCategory && (
              <MovieRow title="Adicionados Recentemente" movies={recentMovies} />
            )}

            {/* By category */}
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
              : moviesByCategory.map((cat) => (
                  <MovieRow
                    key={cat.id}
                    title={cat.name}
                    movies={cat.movies}
                  />
                ))}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-xs mt-8 border-t border-dark-border">
        <p>Dorama Flix &copy; {new Date().getFullYear()}. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
