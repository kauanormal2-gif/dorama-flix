"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Play,
  Heart,
  ArrowLeft,
  Star,
  Calendar,
  Clock,
  RotateCcw,
  Check,
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

interface ProgressData {
  timestamp: number;
  progress: number;
  completed: boolean;
  title: string;
  thumbnail: string;
  lastWatched: string;
}

const PROGRESS_KEY = "doramaflix_progress";

function getProgress(slug: string): ProgressData | null {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    return all[slug] || null;
  } catch {
    return null;
  }
}

function saveProgress(slug: string, data: ProgressData) {
  try {
    const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
    all[slug] = data;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
  } catch {}
}

function isDriveUrl(url: string) {
  return url.includes("drive.google.com");
}

export default function MovieDetailClient({ movie, related }: Props) {
  const [playing, setPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [markedAsWatched, setMarkedAsWatched] = useState(false);
  const [savedProgress, setSavedProgress] = useState<ProgressData | null>(null);
  const [resumeFrom, setResumeFrom] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isdriveVideo = isDriveUrl(movie.videoUrl);

  useEffect(() => {
    const progress = getProgress(movie.slug);
    if (progress) {
      if (progress.completed) {
        setMarkedAsWatched(true);
      } else if (progress.timestamp > 5) {
        setSavedProgress(progress);
      }
    }
  }, [movie.slug]);

  const startWatching = (fromBeginning = false) => {
    if (fromBeginning) {
      setResumeFrom(0);
    } else if (savedProgress) {
      setResumeFrom(savedProgress.timestamp);
    } else {
      setResumeFrom(null);
    }
    setPlaying(true);
  };

  const handleVideoReady = () => {
    if (videoRef.current && resumeFrom && resumeFrom > 0) {
      videoRef.current.currentTime = resumeFrom;
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || video.duration === 0) return;

    const progress = (video.currentTime / video.duration) * 100;
    const completed = progress >= 90;

    saveProgress(movie.slug, {
      timestamp: video.currentTime,
      progress,
      completed,
      title: movie.title,
      thumbnail: movie.thumbnail,
      lastWatched: new Date().toISOString(),
    });
  };

  const toggleWatched = () => {
    const newState = !markedAsWatched;
    setMarkedAsWatched(newState);

    if (newState) {
      // Marca como visto
      saveProgress(movie.slug, {
        timestamp: 0,
        progress: 100,
        completed: true,
        title: movie.title,
        thumbnail: movie.thumbnail,
        lastWatched: new Date().toISOString(),
      });
      setSavedProgress(null);
    } else {
      // Remove dos vistos
      try {
        const all = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
        delete all[movie.slug];
        localStorage.setItem(PROGRESS_KEY, JSON.stringify(all));
      } catch {}
    }
  };

  const handleDrivePlay = () => {
    // For Drive videos, just mark as started
    const existing = getProgress(movie.slug);
    if (!existing || existing.completed) {
      saveProgress(movie.slug, {
        timestamp: 0,
        progress: 5,
        completed: false,
        title: movie.title,
        thumbnail: movie.thumbnail,
        lastWatched: new Date().toISOString(),
      });
    }
    setPlaying(true);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playing || isdriveVideo) return;

    video.addEventListener("loadedmetadata", handleVideoReady);
    saveIntervalRef.current = setInterval(handleTimeUpdate, 5000);

    const handleEnded = () => {
      saveProgress(movie.slug, {
        timestamp: video.duration,
        progress: 100,
        completed: true,
        title: movie.title,
        thumbnail: movie.thumbnail,
        lastWatched: new Date().toISOString(),
      });
    };
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("loadedmetadata", handleVideoReady);
      video.removeEventListener("ended", handleEnded);
      if (saveIntervalRef.current) clearInterval(saveIntervalRef.current);
    };
  }, [playing]);

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

          {isdriveVideo ? (
            <iframe
              src={movie.videoUrl}
              className="w-full h-full"
              allow="autoplay"
              allowFullScreen
            />
          ) : (
            <video
              ref={videoRef}
              src={movie.videoUrl}
              className="w-full h-full"
              controls
              autoPlay
            />
          )}
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

                  {/* Progress bar */}
                  {savedProgress && (
                    <div className="mb-4">
                      <div className="w-full max-w-xs bg-white/20 rounded-full h-1 mb-1">
                        <div
                          className="bg-primary h-1 rounded-full"
                          style={{ width: `${Math.min(savedProgress.progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-gray-400 text-xs">
                        {Math.round(savedProgress.progress)}% assistido
                      </p>
                    </div>
                  )}

                  <p className="text-gray-300 text-sm md:text-base mb-6 max-w-2xl line-clamp-4">
                    {movie.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {savedProgress ? (
                      <>
                        <button
                          onClick={() => startWatching(false)}
                          className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-8 py-3 rounded-full font-semibold transition"
                        >
                          <Play size={18} fill="white" />
                          Continuar
                        </button>
                        <button
                          onClick={() => startWatching(true)}
                          className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-6 py-3 rounded-full font-semibold transition text-sm"
                        >
                          <RotateCcw size={16} />
                          Recomeçar
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          isdriveVideo ? handleDrivePlay() : startWatching()
                        }
                        className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-8 py-3 rounded-full font-semibold transition"
                      >
                        <Play size={18} fill="white" />
                        Assistir Agora
                      </button>
                    )}
                    {/* Marcar como visto */}
                    <button
                      onClick={toggleWatched}
                      title={markedAsWatched ? "Remover dos vistos" : "Marcar como visto"}
                      className={`flex items-center gap-2 px-5 py-3 rounded-full font-medium transition text-sm ${
                        markedAsWatched
                          ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                          : "bg-white/20 hover:bg-white/30 text-white"
                      }`}
                    >
                      <Check size={16} />
                      {markedAsWatched ? "Visto" : "Marcar como visto"}
                    </button>

                    <button
                      onClick={() => setFavorited(!favorited)}
                      className={`p-3 rounded-full transition ${
                        favorited
                          ? "bg-primary text-white"
                          : "bg-white/20 hover:bg-white/30"
                      }`}
                    >
                      <Heart size={18} fill={favorited ? "white" : "none"} />
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
