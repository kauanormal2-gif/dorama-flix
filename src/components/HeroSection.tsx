"use client";

import Link from "next/link";
import { Play, Info } from "lucide-react";

interface HeroProps {
  movie: {
    slug: string;
    title: string;
    description: string;
    bannerUrl?: string | null;
    thumbnail: string;
    year?: number | null;
    categories?: { category: { name: string } }[];
  };
}

export default function HeroSection({ movie }: HeroProps) {
  const bgImage = movie.bannerUrl || movie.thumbnail;

  return (
    <section className="relative h-[70vh] md:h-[80vh] w-full">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/50 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/80 to-transparent" />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-16 md:pb-24">
        <div className="max-w-2xl animate-fade-in">
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
    </section>
  );
}
