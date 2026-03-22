"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight } from "lucide-react";

interface Movie {
  slug: string;
  title: string;
  description: string;
  bannerUrl?: string | null;
  thumbnail: string;
  year?: number | null;
  categories?: { category: { name: string } }[];
}

interface HeroProps {
  movies: Movie[];
}

export default function HeroSection({ movies }: HeroProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      if (animating || movies.length <= 1) return;
      setAnimating(true);
      setTimeout(() => {
        setCurrent(index);
        setAnimating(false);
      }, 300);
    },
    [animating, movies.length]
  );

  const next = useCallback(() => {
    goTo((current + 1) % movies.length);
  }, [current, movies.length, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + movies.length) % movies.length);
  }, [current, movies.length, goTo]);

  // Auto-avança a cada 6 segundos
  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(next, 6000);
    return () => clearInterval(interval);
  }, [next, movies.length]);

  if (!movies.length) return null;

  const movie = movies[current];
  const bgImage = movie.bannerUrl || movie.thumbnail;

  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full overflow-hidden">
      {/* Background */}
      <div
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500 ${
          animating ? "opacity-0" : "opacity-100"
        }`}
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/80 to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
        <div
          className={`max-w-2xl transition-all duration-500 ${
            animating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          }`}
        >
          {movie.categories && movie.categories.length > 0 && (
            <div className="flex gap-2 mb-3">
              {movie.categories.map((c) => (
                <span
                  key={c.category.name}
                  className="text-xs bg-primary/30 text-primary px-2 py-1 rounded-full"
                >
                  {c.category.name}
                </span>
              ))}
            </div>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
            {movie.title}
          </h1>
          <p className="text-gray-300 text-sm md:text-base mb-6 line-clamp-3">
            {movie.description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={`/filme/${movie.slug}`}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-full font-semibold transition text-sm md:text-base"
            >
              <Play size={18} fill="white" />
              Assistir Agora
            </Link>
            <Link
              href={`/filme/${movie.slug}`}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full font-medium transition text-sm md:text-base"
            >
              <Info size={18} />
              Mais Info
            </Link>
          </div>
        </div>
      </div>

      {/* Navegação — só aparece se tiver mais de 1 */}
      {movies.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full transition"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/40 hover:bg-black/60 rounded-full transition"
          >
            <ChevronRight size={20} className="text-white" />
          </button>

          {/* Bolinhas indicadoras */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current
                    ? "bg-white w-6"
                    : "bg-white/40 hover:bg-white/60 w-2"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
