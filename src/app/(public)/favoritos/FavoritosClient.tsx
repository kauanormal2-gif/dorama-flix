"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import MovieCard from "@/components/MovieCard";
import { getFavorites } from "@/lib/favorites";

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  rating?: number | null;
  year?: number | null;
  categories: { category: { id: string; name: string; slug: string } }[];
}

export default function FavoritosClient({ movies }: { movies: Movie[] }) {
  const [favSlugs, setFavSlugs] = useState<string[] | null>(null);

  useEffect(() => {
    setFavSlugs(getFavorites());
  }, []);

  const favoriteMovies =
    favSlugs === null ? [] : movies.filter((m) => favSlugs.includes(m.slug));

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <span className="h-8 w-1 bg-primary rounded-full" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Meus Favoritos
        </h1>
        {favSlugs !== null && (
          <span className="text-sm text-gray-500 font-medium">
            {favoriteMovies.length}
          </span>
        )}
      </div>

      {favSlugs === null ? (
        <div className="py-20 text-center text-gray-500 text-sm">Carregando…</div>
      ) : favoriteMovies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Heart size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Sua lista está vazia
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm">
            Toque no coração em qualquer filme para adicioná-lo aos seus
            favoritos e encontrá-lo aqui rapidinho.
          </p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary-hover px-6 py-3 rounded-full font-semibold text-sm transition shadow-[0_10px_30px_-10px_rgba(229,9,20,0.7)]"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 md:gap-5">
          {favoriteMovies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </div>
  );
}
