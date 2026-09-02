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
  const raw = movie.bannerUrl || movie.thumbnail;
  // Passa pelo otimizador do Next (AVIF/WebP redimensionado). Só pro R2 —
  // banner do Drive redireciona e o otimizador não dá conta.
  const bgImage = raw.includes(".r2.dev")
    ? `/_next/image?url=${encodeURIComponent(raw)}&w=1080&q=65`
    : raw;

  return (
    <section className="relative h-[85vh] md:h-[92vh] w-full overflow-hidden">
      {/* Background com zoom sutil */}
      <div
        key={current}
        className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ${
          animating ? "opacity-0 scale-105" : "opacity-100 scale-100"
        }`}
        style={{
          backgroundImage: `url(${bgImage})`,
          animation: !animating ? "kenburns 8s ease-out forwards" : undefined,
        }}
      />

      {/* Cinematic gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/80 to-transparent md:via-dark/40" />
      <div className="absolute inset-0 bg-gradient-to-b from-dark/40 via-transparent to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-end pb-20 md:pb-32">
        <div
          className={`max-w-2xl transition-all duration-700 ${
            animating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          {movie.categories && movie.categories.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <span className="h-px w-8 bg-primary" />
              {movie.categories.slice(0, 3).map((c) => (
                <span
                  key={c.category.name}
                  className="text-[11px] font-semibold text-primary uppercase tracking-[0.15em]"
                >
                  {c.category.name}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-4xl md:text-7xl font-extrabold mb-5 leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
            {movie.title}
          </h1>

          <p className="text-gray-200/90 text-sm md:text-lg mb-8 line-clamp-3 max-w-xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            {movie.description}
          </p>

          <div className="flex items-center gap-3">
            <Link
              href={`/filme/${movie.slug}`}
              className="group flex items-center gap-2.5 bg-primary hover:bg-primary-hover px-7 py-3.5 rounded-full font-semibold transition-all text-sm md:text-base shadow-[0_10px_40px_-10px_rgba(229,9,20,0.7)] hover:shadow-[0_10px_50px_-5px_rgba(229,9,20,0.9)] hover:-translate-y-0.5"
            >
              <Play size={18} fill="white" className="group-hover:scale-110 transition" />
              Assistir Agora
            </Link>
            <Link
              href={`/filme/${movie.slug}`}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-7 py-3.5 rounded-full font-medium transition text-sm md:text-base"
            >
              <Info size={18} />
              Mais Info
            </Link>
          </div>
        </div>
      </div>

      {/* Navegação */}
      {movies.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Anterior"
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/10 rounded-full transition group"
          >
            <ChevronLeft size={22} className="text-white group-hover:-translate-x-0.5 transition" />
          </button>
          <button
            onClick={next}
            aria-label="Próximo"
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 items-center justify-center bg-black/30 hover:bg-black/60 backdrop-blur-sm border border-white/10 rounded-full transition group"
          >
            <ChevronRight size={22} className="text-white group-hover:translate-x-0.5 transition" />
          </button>

          {/* Barras indicadoras */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {movies.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  i === current
                    ? "bg-primary w-10"
                    : "bg-white/30 hover:bg-white/50 w-5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
