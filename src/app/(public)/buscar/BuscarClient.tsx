"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import MovieCard from "@/components/MovieCard";

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  description?: string | null;
  rating?: number | null;
  year?: number | null;
  categories: { category: { id: string; name: string; slug: string } }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  movies: Movie[];
  categories: Category[];
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function BuscarClient({ movies, categories }: Props) {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const byCategory = movies.filter(
      (m) => !activeCat || m.categories.some((c) => c.category.slug === activeCat)
    );

    // Busca por palavras soltas: cada termo pode aparecer em qualquer ordem,
    // no título, na descrição ou na categoria.
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    if (!terms.length) return byCategory;

    const phrase = terms.join(" ");
    const results: { movie: Movie; score: number }[] = [];

    for (const m of byCategory) {
      const title = normalize(m.title);
      const haystack = `${title} ${normalize(m.description ?? "")} ${m.categories
        .map((c) => normalize(c.category.name))
        .join(" ")}`;

      if (!terms.every((t) => haystack.includes(t))) continue;

      // Relevância: título exato > título contém > só bate na descrição/categoria
      let score = 0;
      if (title.startsWith(phrase)) score = 3;
      else if (title.includes(phrase)) score = 2;
      else if (terms.every((t) => title.includes(t))) score = 1;

      results.push({ movie: m, score });
    }

    results.sort(
      (a, b) => b.score - a.score || a.movie.title.localeCompare(b.movie.title)
    );
    return results.map((r) => r.movie);
  }, [movies, query, activeCat]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="h-8 w-1 bg-primary rounded-full" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Buscar
        </h1>
      </div>

      {/* Search input */}
      <div className="relative mb-6">
        <Search
          size={20}
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar por título…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-white/10 rounded-full pl-14 pr-12 py-4 text-white placeholder-gray-500 outline-none transition text-base"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            aria-label="Limpar"
            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-8"
        style={{ scrollbarWidth: "none" }}
      >
        <button
          onClick={() => setActiveCat("")}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${
            !activeCat
              ? "bg-primary border-primary text-white"
              : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.slug)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition border ${
              activeCat === cat.slug
                ? "bg-primary border-primary text-white"
                : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-sm text-gray-400">
          {query || activeCat
            ? `${filtered.length} ${filtered.length === 1 ? "resultado" : "resultados"}`
            : "1200 resultados"}
          {query && (
            <>
              {" "}para <span className="text-white">&quot;{query}&quot;</span>
            </>
          )}
        </p>
      </div>

      {/* Results grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Search size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Nada encontrado
          </h2>
          <p className="text-gray-400 text-sm max-w-sm">
            Tente outro termo ou remova o filtro de categoria.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 md:gap-5">
          {filtered.map((movie) => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>
      )}
    </div>
  );
}
