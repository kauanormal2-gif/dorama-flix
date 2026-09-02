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
  MessageCircle,
} from "lucide-react";
import MovieRow from "@/components/MovieRow";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { linkQueroAssinar } from "@/lib/suporte";

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

/** As sugestões do rodapé são só capinhas: sem sinopse e sem link de vídeo. */
type MovieRelacionado = Omit<Movie, "description" | "videoUrl">;

interface Props {
  movie: Movie;
  related: MovieRelacionado[];
  hasAccess: boolean;
  /** Entrou por link de divulgação — vê a oferta quando a série termina. */
  convidada?: boolean;
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

  // Manda pro servidor também, pra aparecer no painel de usuários.
  // Se estiver deslogado a rota responde saved:false e segue a vida.
  fetch("/api/watch-progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      timestamp: data.timestamp,
      progress: data.progress,
      completed: data.completed,
    }),
  }).catch(() => {});
}

function isDriveUrl(url: string) {
  return url.includes("drive.google.com");
}

export default function MovieDetailClient({
  movie,
  related,
  hasAccess,
  convidada = false,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [markedAsWatched, setMarkedAsWatched] = useState(false);
  const [savedProgress, setSavedProgress] = useState<ProgressData | null>(null);
  const [resumeFrom, setResumeFrom] = useState<number | null>(null);
  const [terminou, setTerminou] = useState(false);
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
    setFavorited(isFavorite(movie.slug));
  }, [movie.slug]);

  const handleToggleFavorite = () => {
    const newState = toggleFavorite(movie.slug);
    setFavorited(newState);
  };

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
      // Acabou a série. Pra quem veio do link de divulgação, é a hora certa de
      // oferecer o app — ela acabou de gostar do que viu.
      if (convidada) setTerminou(true);
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
  }, [playing, convidada]);

  const bgRaw = movie.bannerUrl || movie.thumbnail;
  // Otimizador do Next (AVIF/WebP redimensionado) só pro R2 — Drive redireciona.
  const bgImage = bgRaw.includes(".r2.dev")
    ? `/_next/image?url=${encodeURIComponent(bgRaw)}&w=1080&q=65`
    : bgRaw;

  return (
    <div>
      {playing ? (
        /* Video Player */
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 py-4 md:px-6">
            <button
              onClick={() => {
                setPlaying(false);
                setTerminou(false);
              }}
              className="flex items-center gap-2 text-white/80 hover:text-white transition flex-shrink-0"
            >
              <ArrowLeft size={22} />
              <span className="text-sm font-medium hidden sm:inline">Voltar</span>
            </button>
            <div className="min-w-0">
              <h2 className="text-white font-semibold text-base md:text-lg truncate">
                {movie.title}
              </h2>
              {movie.year && (
                <p className="text-white/50 text-xs">{movie.year}</p>
              )}
            </div>
          </div>


          {/* Acabou a série e ela veio de link de divulgação: a oferta entra
              por cima do vídeo, no momento em que ela mais quer mais. */}
          {terminou && (
            <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto">
              <div className="w-full max-w-md text-center py-8">
                <p className="text-primary text-base font-semibold mb-2">
                  Você terminou {movie.title.trim()}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  Gostou? Tem mais de 1.200 séries te esperando
                </h3>
                <p className="text-gray-300 text-base mb-7">
                  Assine e assista tudo quando quiser, sem limite. A partir de
                  R$ 9,90 por mês.
                </p>

                <Link
                  href="/assinar"
                  className="block w-full bg-primary hover:bg-primary-hover text-white text-lg font-semibold py-4 rounded-xl transition mb-3"
                >
                  Quero assinar
                </Link>
                <a
                  href={linkQueroAssinar(movie.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-white/20 bg-white/5 hover:bg-white/10 text-white text-base py-3.5 rounded-xl transition mb-3"
                >
                  <MessageCircle size={18} className="text-green-400" />
                  Falar no WhatsApp
                </a>
                <button
                  onClick={() => {
                    setTerminou(false);
                    setPlaying(false);
                  }}
                  className="text-gray-400 hover:text-white text-base py-2 transition"
                >
                  Agora não
                </button>
              </div>
            </div>
          )}

          {/* Video */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
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
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            )}
          </div>
        </div>
      ) : (
        /* Movie Detail */
        <div>
          {/* Hero Banner */}
          <div className="relative min-h-[80vh] md:min-h-[85vh]">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${bgImage})` }}
            />
            {/* Cinematic gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/70 to-dark/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark via-dark/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-dark/50 via-transparent to-transparent" />

            {/* Back button */}
            <div className="absolute top-24 left-4 md:left-6 z-10">
              <Link
                href="/"
                className="flex items-center gap-2 bg-black/40 hover:bg-black/70 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-sm transition"
              >
                <ArrowLeft size={16} />
                Voltar
              </Link>
            </div>

            {/* Content */}
            <div className="relative min-h-[80vh] md:min-h-[85vh] max-w-7xl mx-auto px-6 flex items-end pb-16 md:pb-20 pt-32">
              <div className="flex flex-col md:flex-row gap-8 items-end md:items-end w-full">
                {/* Poster */}
                <div className="relative flex-shrink-0 hidden md:block">
                  <img
                    src={movie.thumbnail}
                    alt={movie.title}
                    className="w-52 lg:w-60 rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] ring-1 ring-white/10"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 animate-fade-in">
                  {/* Categories */}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="h-px w-8 bg-primary" />
                    {movie.categories.map((c) => (
                      <span
                        key={c.category.id}
                        className="text-[11px] font-semibold uppercase tracking-[0.15em] text-primary"
                      >
                        {c.category.name}
                      </span>
                    ))}
                  </div>

                  <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-[1.05] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                    {movie.title}
                  </h1>

                  {/* Meta */}
                  <div className="flex items-center gap-5 text-sm text-gray-300 mb-5">
                    {movie.rating && (
                      <span className="flex items-center gap-1.5">
                        <Star size={14} className="text-gold fill-gold" />
                        <span className="font-semibold text-white">{movie.rating.toFixed(1)}</span>
                      </span>
                    )}
                    {movie.year && (
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-500" />
                        {movie.year}
                      </span>
                    )}
                    {movie.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-500" />
                        {movie.duration}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {savedProgress && (
                    <div className="mb-5">
                      <div className="w-full max-w-xs bg-white/10 rounded-full h-1 mb-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full"
                          style={{ width: `${Math.min(savedProgress.progress, 100)}%` }}
                        />
                      </div>
                      <p className="text-gray-400 text-xs">
                        {Math.round(savedProgress.progress)}% assistido
                      </p>
                    </div>
                  )}

                  <p className="text-gray-200/90 text-sm md:text-base mb-8 max-w-2xl line-clamp-4 leading-relaxed">
                    {movie.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {!hasAccess ? (
                      <>
                        <Link
                          href="/assinar"
                          className="group flex items-center gap-2.5 bg-primary hover:bg-primary-hover px-8 py-3.5 rounded-full font-semibold transition-all shadow-[0_10px_40px_-10px_rgba(229,9,20,0.7)] hover:shadow-[0_10px_50px_-5px_rgba(229,9,20,0.9)] hover:-translate-y-0.5"
                        >
                          <Play size={18} fill="white" className="group-hover:scale-110 transition" />
                          Assinar para Assistir
                        </Link>
                        {/* Sem isto, quem já pagou e perdeu a sessão só via a
                            oferta de assinar — e achava que o site quebrou. */}
                        <Link
                          href="/login"
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3.5 rounded-full font-medium transition"
                        >
                          Já assinei, entrar
                        </Link>
                      </>
                    ) : savedProgress ? (
                      <>
                        <button
                          onClick={() => startWatching(false)}
                          className="group flex items-center gap-2.5 bg-primary hover:bg-primary-hover px-8 py-3.5 rounded-full font-semibold transition-all shadow-[0_10px_40px_-10px_rgba(229,9,20,0.7)] hover:shadow-[0_10px_50px_-5px_rgba(229,9,20,0.9)] hover:-translate-y-0.5"
                        >
                          <Play size={18} fill="white" className="group-hover:scale-110 transition" />
                          Continuar
                        </button>
                        <button
                          onClick={() => startWatching(true)}
                          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 px-6 py-3.5 rounded-full font-medium transition text-sm"
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
                        className="group flex items-center gap-2.5 bg-primary hover:bg-primary-hover px-8 py-3.5 rounded-full font-semibold transition-all shadow-[0_10px_40px_-10px_rgba(229,9,20,0.7)] hover:shadow-[0_10px_50px_-5px_rgba(229,9,20,0.9)] hover:-translate-y-0.5"
                      >
                        <Play size={18} fill="white" className="group-hover:scale-110 transition" />
                        Assistir Agora
                      </button>
                    )}
                    {/* Marcar como visto */}
                    <button
                      onClick={toggleWatched}
                      title={markedAsWatched ? "Remover dos vistos" : "Marcar como visto"}
                      className={`flex items-center gap-2 px-5 py-3.5 rounded-full font-medium transition text-sm backdrop-blur-md border ${
                        markedAsWatched
                          ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                          : "bg-white/10 hover:bg-white/20 text-white border-white/20"
                      }`}
                    >
                      <Check size={16} />
                      {markedAsWatched ? "Visto" : "Marcar como visto"}
                    </button>

                    <button
                      onClick={handleToggleFavorite}
                      aria-label="Favoritar"
                      className={`p-3.5 rounded-full transition backdrop-blur-md border ${
                        favorited
                          ? "bg-primary text-white border-primary shadow-lg shadow-primary/30"
                          : "bg-white/10 hover:bg-white/20 border-white/20"
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
            <div className="max-w-7xl mx-auto mt-12 pb-16">
              <MovieRow title="Você também vai gostar" movies={related} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
