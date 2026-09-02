"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Play, Star } from "lucide-react";

interface MovieCardProps {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  rating?: number | null;
  year?: number | null;
  categories?: { category: { name: string } }[];
  progress?: number;
}

export default function MovieCard({
  title,
  slug,
  thumbnail,
  rating,
  year,
  categories,
  progress,
}: MovieCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={`/filme/${slug}`}
      className="group relative flex-shrink-0 w-[150px] md:w-[190px] transition-all duration-300 hover:scale-[1.03] hover:z-10"
    >
      <div className="aspect-[2/3] bg-dark-lighter relative rounded-xl overflow-hidden ring-1 ring-white/5 group-hover:ring-primary/50 transition-all shadow-lg group-hover:shadow-[0_20px_50px_-10px_rgba(229,9,20,0.5)]">
        {/* Placeholder shimmer enquanto imagem carrega */}
        {!loaded && (
          <div className="absolute inset-0 skeleton opacity-40" aria-hidden />
        )}
        <Image
          src={
            failed
              ? `https://placehold.co/200x300/1a1a2e/e50914?text=${encodeURIComponent(title.slice(0, 15))}`
              : thumbnail
          }
          alt={title}
          fill
          // placehold.co devolve SVG, que o otimizador recusa — serve direto
          unoptimized={failed}
          // No Android o card tem 150px; sem isso o browser baixaria o PNG inteiro
          sizes="(max-width: 768px) 150px, 190px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />

        {/* Permanent bottom gradient for title readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

        {/* Rating badge top-right */}
        {rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md">
            <Star size={10} className="text-gold fill-gold" />
            <span className="text-[10px] font-semibold text-white">{rating.toFixed(1)}</span>
          </div>
        )}

        {/* Title always visible at bottom */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h3 className="text-sm font-bold text-white line-clamp-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            {title}
          </h3>
          {year && (
            <p className="text-[10px] text-gray-400 mt-0.5">{year}</p>
          )}
        </div>

        {/* Hover overlay with play button */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-[0_10px_30px_-5px_rgba(229,9,20,0.8)] scale-90 group-hover:scale-100 transition-transform">
            <Play size={22} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Categories tag - hover only */}
        {categories && categories.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {categories.slice(0, 1).map((c) => (
              <span
                key={c.category.name}
                className="text-[9px] font-semibold uppercase tracking-wider bg-primary/90 text-white px-1.5 py-0.5 rounded"
              >
                {c.category.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Progress bar */}
      {progress !== undefined && progress > 0 && (
        <div className="w-full bg-white/10 rounded-full h-1 mt-2 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </Link>
  );
}
