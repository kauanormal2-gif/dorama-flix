"use client";

import { useRef } from "react";
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
}

export default function MovieRow({ title, movies }: MovieRowProps) {
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
    <section className="mb-8">
      <h2 className="text-lg md:text-xl font-bold mb-4 px-4 md:px-0">
        {title}
      </h2>
      <div className="relative group">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-8 z-10 w-10 bg-gradient-to-r from-dark to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <ChevronLeft size={24} />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-8 z-10 w-10 bg-gradient-to-l from-dark to-transparent opacity-0 group-hover:opacity-100 transition flex items-center justify-center"
        >
          <ChevronRight size={24} />
        </button>

        {/* Movie list */}
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-0 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          {movies.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      </div>
    </section>
  );
}
