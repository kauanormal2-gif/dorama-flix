"use client";

import Link from "next/link";
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
  return (
    <Link
      href={`/filme/${slug}`}
      className="group relative flex-shrink-0 w-[180px] md:w-[200px] rounded-lg overflow-hidden transition-transform hover:scale-105 hover:z-10"
    >
      <div className="aspect-[2/3] bg-dark-lighter relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://placehold.co/200x300/1a1a2e/e50914?text=${encodeURIComponent(title.slice(0,15))}`;
          }}
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
          <div className="flex items-center justify-center mb-2">
            <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center">
              <Play size={18} fill="white" className="text-white ml-0.5" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-white line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
            {rating && (
              <span className="flex items-center gap-0.5">
                <Star size={10} className="text-gold fill-gold" />
                {rating.toFixed(1)}
              </span>
            )}
            {year && <span>{year}</span>}
          </div>
          {categories && categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {categories.slice(0, 2).map((c) => (
                <span
                  key={c.category.name}
                  className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded"
                >
                  {c.category.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Progress bar */}
      {progress !== undefined && progress > 0 && (
        <div className="w-full bg-white/20 rounded-full h-0.5 mt-1">
          <div
            className="bg-primary h-0.5 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
      {/* Title below card */}
      <p className="text-xs text-gray-400 mt-1 line-clamp-1 group-hover:text-white transition">
        {title}
      </p>
    </Link>
  );
}
