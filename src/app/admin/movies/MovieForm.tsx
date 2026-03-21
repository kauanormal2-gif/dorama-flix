"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Upload, Link as LinkIcon, Film, FileVideo } from "lucide-react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";

interface Category {
  id: string;
  name: string;
}

interface MovieData {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  bannerUrl?: string | null;
  year?: number | null;
  duration?: string | null;
  rating?: number | null;
  featured: boolean;
  status: string;
  categories?: { categoryId: string }[];
}

export default function MovieForm({ movie }: { movie?: MovieData }) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState("");
  const [thumbnailMode, setThumbnailMode] = useState<"upload" | "url">("upload");
  const [videoMode, setVideoMode] = useState<"upload" | "drive">("drive");

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: movie?.title || "",
    description: movie?.description || "",
    thumbnail: movie?.thumbnail || "",
    videoUrl: movie?.videoUrl || "",
    bannerUrl: movie?.bannerUrl || "",
    year: movie?.year?.toString() || "",
    duration: movie?.duration || "",
    rating: movie?.rating?.toString() || "",
    featured: movie?.featured || false,
    status: movie?.status || "active",
    categoryIds: movie?.categories?.map((c) => c.categoryId) || [],
  });

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, []);

  // Detect if existing movie has Drive URL
  useEffect(() => {
    if (movie?.videoUrl?.includes("drive.google.com")) {
      setVideoMode("drive");
    } else if (movie?.videoUrl) {
      setVideoMode("upload");
    }
    if (movie?.thumbnail) {
      setThumbnailMode("url");
    }
  }, [movie]);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setError("");
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      setForm((prev) => ({ ...prev, thumbnail: blob.url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer upload";
      setError(msg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleVideoUpload = async (file: File) => {
    setUploadingVideo(true);
    setError("");
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setVideoUploadProgress(`Enviando vídeo (${sizeMB} MB)...`);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload",
      });
      setForm((prev) => ({ ...prev, videoUrl: blob.url }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer upload";
      setError(msg);
    } finally {
      setUploadingVideo(false);
      setVideoUploadProgress("");
    }
  };

  // Convert Drive share link to embed URL
  function toDriveEmbed(url: string): string {
    const match = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    const match2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (match2) return `https://drive.google.com/file/d/${match2[1]}/preview`;
    return url;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // Auto-convert Drive links to embed
      const videoUrl =
        videoMode === "drive" ? toDriveEmbed(form.videoUrl) : form.videoUrl;

      const url = movie?.id
        ? `/api/admin/movies/${movie.id}`
        : "/api/admin/movies";
      const method = movie?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, videoUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao salvar");
        return;
      }

      router.push("/admin/movies");
      router.refresh();
    } catch {
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((c) => c !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const isDriveLink = form.videoUrl.includes("drive.google.com");

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl">
      <Link
        href="/admin/movies"
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4 transition"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* Title */}
        <div>
          <label className="text-sm text-gray-400 block mb-1">Título *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Descrição *
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
            rows={4}
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition resize-none"
          />
        </div>

        {/* ── IMAGEM DE CAPA ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400 font-medium">
              Imagem de Capa *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setThumbnailMode("upload")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                  thumbnailMode === "upload"
                    ? "bg-primary text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                <Upload size={12} />
                Upload
              </button>
              <button
                type="button"
                onClick={() => setThumbnailMode("url")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                  thumbnailMode === "url"
                    ? "bg-primary text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                <LinkIcon size={12} />
                URL
              </button>
            </div>
          </div>

          {thumbnailMode === "upload" ? (
            <div
              onClick={() => !uploadingImage && imageInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleImageUpload(file);
              }}
              className="w-full bg-dark-card border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
            >
              {uploadingImage ? (
                <p className="text-yellow-400 text-sm">Enviando imagem...</p>
              ) : form.thumbnail ? (
                <div className="flex items-center justify-center gap-4">
                  <img
                    src={form.thumbnail}
                    alt="Preview"
                    className="w-20 h-28 object-cover rounded"
                  />
                  <div>
                    <p className="text-green-400 text-sm mb-1">
                      Imagem carregada!
                    </p>
                    <p className="text-gray-500 text-xs">Clique para trocar</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400 text-sm">
                    Clique ou arraste a imagem aqui
                  </p>
                  <p className="text-gray-600 text-xs mt-1">JPG ou PNG</p>
                </>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
            </div>
          ) : (
            <>
              <input
                type="url"
                value={form.thumbnail}
                onChange={(e) =>
                  setForm({ ...form, thumbnail: e.target.value })
                }
                required
                placeholder="https://..."
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
              />
              {form.thumbnail && (
                <div className="mt-2">
                  <img
                    src={form.thumbnail}
                    alt="Preview"
                    className="w-20 h-28 object-cover rounded-lg"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* ── VÍDEO ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-400 font-medium">
              Vídeo *
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setVideoMode("upload")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                  videoMode === "upload"
                    ? "bg-primary text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                <FileVideo size={12} />
                Upload MP4
              </button>
              <button
                type="button"
                onClick={() => setVideoMode("drive")}
                className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition ${
                  videoMode === "drive"
                    ? "bg-primary text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                <Film size={12} />
                Link do Drive
              </button>
            </div>
          </div>

          {videoMode === "upload" ? (
            <div
              onClick={() =>
                !uploadingVideo && videoInputRef.current?.click()
              }
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file) handleVideoUpload(file);
              }}
              className="w-full bg-dark-card border-2 border-dashed border-dark-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition"
            >
              {uploadingVideo ? (
                <div>
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-yellow-400 text-sm">
                    {videoUploadProgress || "Enviando vídeo..."}
                  </p>
                  <p className="text-gray-600 text-xs mt-1">
                    Isso pode levar alguns minutos dependendo do tamanho
                  </p>
                </div>
              ) : form.videoUrl && !form.videoUrl.includes("drive.google.com") ? (
                <div>
                  <FileVideo size={32} className="mx-auto mb-2 text-green-400" />
                  <p className="text-green-400 text-sm mb-1">
                    Vídeo carregado!
                  </p>
                  <p className="text-gray-500 text-xs">Clique para trocar</p>
                </div>
              ) : (
                <>
                  <FileVideo size={32} className="mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400 text-sm">
                    Clique ou arraste o vídeo aqui
                  </p>
                  <p className="text-gray-600 text-xs mt-1">MP4</p>
                </>
              )}
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleVideoUpload(file);
                }}
              />
            </div>
          ) : (
            <>
              <input
                type="url"
                value={form.videoUrl}
                onChange={(e) =>
                  setForm({ ...form, videoUrl: e.target.value })
                }
                required
                placeholder="https://drive.google.com/file/d/.../view"
                className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
              />
              {isDriveLink && (
                <p className="text-green-400 text-xs mt-1">
                  Link do Drive detectado — será convertido para embed automaticamente
                </p>
              )}
              <p className="text-gray-600 text-xs mt-1">
                Cole o link de compartilhamento do Google Drive
              </p>
            </>
          )}
        </div>

        {/* Banner */}
        <div>
          <label className="text-sm text-gray-400 block mb-1">
            URL do Banner (opcional — aparece no hero da home)
          </label>
          <input
            type="url"
            value={form.bannerUrl}
            onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
            placeholder="https://..."
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        {/* Year, Duration, Rating */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Ano</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              placeholder="2024"
              className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Duração</label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="1h 30min"
              className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">Rating</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              placeholder="8.5"
              className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="text-sm text-gray-400 block mb-2">Categorias</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                  form.categoryIds.includes(cat.id)
                    ? "bg-primary text-white"
                    : "bg-white/10 text-gray-400 hover:bg-white/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-600 text-xs">
                Nenhuma categoria. Crie uma primeiro.
              </p>
            )}
          </div>
        </div>

        {/* Status & Featured */}
        <div className="flex items-center gap-6">
          <div>
            <label className="text-sm text-gray-400 block mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            >
              <option value="active">Ativo</option>
              <option value="draft">Rascunho</option>
              <option value="inactive">Inativo</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              id="featured"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="w-4 h-4 rounded accent-primary"
            />
            <label htmlFor="featured" className="text-sm text-gray-300">
              Destaque na home
            </label>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving || uploadingImage || uploadingVideo}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition"
        >
          <Save size={16} />
          {saving
            ? "Salvando..."
            : movie?.id
            ? "Atualizar"
            : "Criar Filme"}
        </button>
      </div>
    </form>
  );
}
