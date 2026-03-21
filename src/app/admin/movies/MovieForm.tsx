"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const url = movie?.id
        ? `/api/admin/movies/${movie.id}`
        : "/api/admin/movies";
      const method = movie?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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

      <div className="space-y-4">
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

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1">
              URL da Thumbnail *
            </label>
            <input
              type="url"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              required
              placeholder="https://..."
              className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1">
              URL do Vídeo *
            </label>
            <input
              type="url"
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              required
              placeholder="https://..."
              className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        {/* Banner */}
        <div>
          <label className="text-sm text-gray-400 block mb-1">
            URL do Banner (opcional)
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

        {/* Preview */}
        {form.thumbnail && (
          <div>
            <label className="text-sm text-gray-400 block mb-1">Preview</label>
            <img
              src={form.thumbnail}
              alt="Preview"
              className="w-32 h-48 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition"
        >
          <Save size={16} />
          {saving ? "Salvando..." : movie?.id ? "Atualizar" : "Criar Filme"}
        </button>
      </div>
    </form>
  );
}
