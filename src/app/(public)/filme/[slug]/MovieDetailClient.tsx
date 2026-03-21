"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Play,
  Heart,
  ArrowLeft,
  Star,
  Calendar,
  Clock,
} from "lucide-react";
import MovieRow from "@/components/MovieRow";

interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  bannerUrl?: string | null;
  year?: number | null;
  duration?: string | null;
  rating?: number | null;
  categories: { category: { id: string; name: string; slug: string } }[];
}

interface Props {
  movie: Movie;
  related: Movie[];
}

export default function MovieDetailClient({ movie, related }: Props) {
  const [playing, setPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);

  const toggleFavorite = async () => {
    setFavorited(!favorited);
    // TODO: API call to toggle favorite
  };

  const bgImage = movie.bannerUrl || movie.thumbnail;

  return (
    <div>
      {playing ? (
        /* Video Player */
        <div className="relative w-full h-screen bg-black">
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => setPlaying(false)}
              className="flex items-center gap-2 bg-black/60 hover:bg-black/80 px-4 py-2 rounded-full text-sm transition"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>
          </div>
          <video
            src={movie.videoUrl}
            className="w-full h-full"
            controls
            autoPlay
          />
        </div>
      ) : (
        /* Movie Detail */
        <div>
          {/* Hero Banner */}
          <div className="relative h-[60vh] md:h-[70vh]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/60 to-dark/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark/80 to-transparent" />

            {/* Back button */}
            <div className="absolute top-20 left-4 z-10">
              <Link
                href="/"
                className="flex items-center gap-2 bg-black/40 hover:bg-black/60 px-4 py-2 rounded-full text-sm transition"
              >
                <ArrowLeft size={16} />
                Voltar
              </Link>
            </div>

            {/* Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 flex items-end pb-12">
              <div className="flex flex-col md:flex-row gap-6 items-end md:items-end">
                {/* Poster */}
                <img
                  src={movie.thumbnail}
                  alt={movie.title}
                  className="w-40 md:w-52 rounded-lg shadow-2xl hidden md:block"
                />

                {/* Info */}
                <div className="flex-1 animate-fade-in">
                  {/* Categories */}
                  <div className="flex gap-2 mb-3">
                    {movie.categories.map((c) => (
                      <span
                        key={c.category.id}
                        className="text-xs bg-primary/30 text-primary px-2 py-1 rounded-full"
                      >
                        {c.category.name}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-3xl md:text-5xl font-extrabold mb-3">
                    {movie.title}
                  </h1>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-300 mb-4">
                    {movie.rating && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="text-gold fill-gold" />
                        {movie.rating.toFixed(1)}
                      </span>
                    )}
                    {movie.year && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {movie.year}
                      </span>
                    )}
                    {movie.duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {movie.duration}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-300 text-sm md:text-base mb-6 max-w-2xl line-clamp-4">
                    {movie.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPlaying(true)}
                      className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-8 py-3 rounded-full font-semibold transition"
                    >
                      <Play size={18} fill="white" />
                      Assistir Agora
                    </button>
                    <button
                      onClick={toggleFavorite}
                      className={`p-3 rounded-full transition ${
                        favorited
                          ? "bg-primary text-white"
                          : "bg-white/20 hover:bg-white/30"
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={favorited ? "white" : "none"}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Related */}
          {related.length > 0 && (
            <div className="max-w-7xl mx-auto mt-8 pb-12">
              <MovieRow title="Relacionados" movies={related} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
