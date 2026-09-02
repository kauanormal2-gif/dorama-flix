"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import MovieRow from "@/components/MovieRow";

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  rating?: number | null;
  year?: number | null;
  categories: { category: { id: string; name: string; slug: string } }[];
}

interface ProgressData {
  timestamp: number;
  progress: number;
  completed: boolean;
  title: string;
  thumbnail: string;
  lastWatched: string;
}

const PROGRESS_KEY = "doramaflix_progress";

export default function HistoricoClient({ movies }: { movies: Movie[] }) {
  const [loaded, setLoaded] = useState(false);
  const [continueWatching, setContinueWatching] = useState<Movie[]>([]);
  const [watched, setWatched] = useState<Movie[]>([]);

  useEffect(() => {
    try {
      const all: Record<string, ProgressData> = JSON.parse(
        localStorage.getItem(PROGRESS_KEY) || "{}"
      );

      const entries = Object.entries(all).sort(
        (a, b) =>
          new Date(b[1].lastWatched).getTime() -
          new Date(a[1].lastWatched).getTime()
      );

      const inProgress: Movie[] = [];
      const completed: Movie[] = [];

      for (const [slug, data] of entries) {
        const movie = movies.find((m) => m.slug === slug);
        if (!movie) continue;
        if (data.completed) {
          completed.push(movie);
        } else if (data.progress > 2) {
          inProgress.push(movie);
        }
      }

      setContinueWatching(inProgress);
      setWatched(completed);
    } catch {}
    setLoaded(true);
  }, [movies]);

  const isEmpty =
    loaded && continueWatching.length === 0 && watched.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-28 pb-16">
      <div className="flex items-center gap-3 mb-8">
        <span className="h-8 w-1 bg-primary rounded-full" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Histórico
        </h1>
      </div>

      {!loaded ? (
        <div className="py-20 text-center text-gray-500 text-sm">Carregando…</div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
            <Clock size={32} className="text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Nada por aqui ainda
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-sm">
            Comece a assistir qualquer dorama e ele vai aparecer aqui para você
            continuar de onde parou.
          </p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary-hover px-6 py-3 rounded-full font-semibold text-sm transition shadow-[0_10px_30px_-10px_rgba(229,9,20,0.7)]"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <>
          {continueWatching.length > 0 && (
            <MovieRow
              title="Continuar Assistindo"
              movies={continueWatching}
              showProgress
            />
          )}
          {watched.length > 0 && (
            <MovieRow title="Assistidos" movies={watched} dimmed />
          )}
        </>
      )}
    </div>
  );
}
