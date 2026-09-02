"use client";

import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  rating?: number | null;
  year?: number | null;
  categories?: { category: { name: string } }[];
}

interface MovieRowProps {
  title: string;
  movies: Movie[];
  showProgress?: boolean;
  dimmed?: boolean;
}

const PROGRESS_KEY = "doramaflix_progress";

export default function MovieRow({ title, movies, showProgress, dimmed }: MovieRowProps) {
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!showProgress && !dimmed) return;
    try {
      const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      const map: Record<string, number> = {};
      for (const [slug, data] of Object.entries(all as Record<string, { progress: number }>)) {
        map[slug] = data.progress;
      }
      setProgressMap(map);
    } catch {}
  }, [showProgress, dimmed]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 400;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (movies.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5 px-4 md:px-6">
        <span className="h-6 w-1 bg-primary rounded-full" />
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <span className="text-xs text-gray-500 font-medium">
          {movies.length}
        </span>
      </div>
      <div className="relative group/row">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          aria-label="Rolar esquerda"
          className="hidden md:flex absolute left-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-r from-dark via-dark/80 to-transparent opacity-0 group-hover/row:opacity-100 transition items-center justify-start pl-2"
        >
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition">
            <ChevronLeft size={20} />
          </div>
        </button>
        <button
          onClick={() => scroll("right")}
          aria-label="Rolar direita"
          className="hidden md:flex absolute right-0 top-0 bottom-0 z-20 w-16 bg-gradient-to-l from-dark via-dark/80 to-transparent opacity-0 group-hover/row:opacity-100 transition items-center justify-end pr-2"
        >
          <div className="w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center hover:bg-primary hover:border-primary transition">
            <ChevronRight size={20} />
          </div>
        </button>

        {/* Movie list */}
        <div
          ref={scrollRef}
          className={`flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-3 pt-1 ${dimmed ? "opacity-60" : ""}`}
          style={{ scrollbarWidth: "none" }}
        >
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              {...movie}
              progress={showProgress || dimmed ? progressMap[movie.slug] : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
