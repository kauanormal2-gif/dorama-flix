"use client";

import { useState, useEffect, useRef } from "react";
import { Upload, Check, AlertCircle, Image as ImageIcon } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
}

export default function BulkImagesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [statuses, setStatuses] = useState<Record<string, "idle" | "uploading" | "done" | "error">>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetch("/api/admin/movies?limit=200")
      .then((r) => r.json())
      .then((d) => setMovies(d.movies || []));
  }, []);

  const handleFile = async (movie: Movie, file: File) => {
    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviews((p) => ({ ...p, [movie.id]: localUrl }));
    setStatuses((s) => ({ ...s, [movie.id]: "uploading" }));

    try {
      // Upload to Blob
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: form });
      const uploadData = await uploadRes.json();
      if (!uploadData.url) throw new Error(uploadData.error || "Falha no upload");

      // Update movie thumbnail
      const updateRes = await fetch(`/api/admin/movies/${movie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thumbnail: uploadData.url }),
      });
      if (!updateRes.ok) throw new Error("Falha ao salvar");

      setStatuses((s) => ({ ...s, [movie.id]: "done" }));
    } catch {
      setStatuses((s) => ({ ...s, [movie.id]: "error" }));
    }
  };

  const done = Object.values(statuses).filter((s) => s === "done").length;
  const total = movies.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Atualizar Capas</h1>
          <p className="text-gray-400 text-sm mt-1">
            Clique em cada capa para trocar a imagem — salva automaticamente
          </p>
        </div>
        {done > 0 && (
          <span className="text-sm text-green-400 font-medium">
            {done}/{total} atualizados
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {movies.map((movie) => {
          const status = statuses[movie.id] || "idle";
          const preview = previews[movie.id] || movie.thumbnail;

          return (
            <div key={movie.id} className="flex flex-col gap-2">
              <button
                onClick={() => inputRefs.current[movie.id]?.click()}
                disabled={status === "uploading"}
                className="relative group aspect-[2/3] rounded-lg overflow-hidden bg-dark-card border border-dark-border hover:border-primary transition"
              >
                {/* Image */}
                <img
                  src={preview}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />

                {/* No image fallback */}
                <div className="absolute inset-0 flex items-center justify-center bg-dark-card">
                  <ImageIcon size={32} className="text-gray-600" />
                </div>

                {/* Overlay */}
                <div className={`absolute inset-0 flex flex-col items-center justify-center transition ${
                  status === "uploading"
                    ? "bg-black/70"
                    : "bg-black/0 group-hover:bg-black/60"
                }`}>
                  {status === "uploading" && (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {status === "done" && (
                    <div className="bg-green-500 rounded-full p-1">
                      <Check size={16} className="text-white" />
                    </div>
                  )}
                  {status === "error" && (
                    <div className="bg-red-500 rounded-full p-1">
                      <AlertCircle size={16} className="text-white" />
                    </div>
                  )}
                  {status === "idle" && (
                    <Upload size={20} className="text-white opacity-0 group-hover:opacity-100 transition" />
                  )}
                </div>
              </button>

              <p className="text-xs text-gray-400 text-center line-clamp-2 leading-tight">
                {movie.title}
              </p>

              <input
                ref={(el) => { inputRefs.current[movie.id] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(movie, file);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
