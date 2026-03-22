"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Search, Star } from "lucide-react";

interface Movie {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  status: string;
  featured: boolean;
  rating: number | null;
  createdAt: string;
  categories: { category: { name: string } }[];
  _count: { favorites: number; watchProgress: number };
}

export default function AdminMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMovies = () => {
    setLoading(true);
    fetch("/api/admin/movies")
      .then((r) => r.json())
      .then((d) => setMovies(d.movies || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMovies(); }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Deletar "${title}"?`)) return;
    await fetch(`/api/admin/movies/${id}`, { method: "DELETE" });
    fetchMovies();
  };

  const handleToggleBanner = async (movie: Movie) => {
    setTogglingId(movie.id);
    const newFeatured = !movie.featured;

    await fetch(`/api/admin/movies/${movie.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: newFeatured }),
    });

    // Atualiza local só o filme clicado
    setMovies((prev) =>
      prev.map((m) =>
        m.id === movie.id ? { ...m, featured: newFeatured } : m
      )
    );

    setTogglingId(null);
  };

  const filtered = movies.filter((m) =>
    m.title.toLowerCase().includes(search.toLowerCase())
  );

  const featuredMovies = movies.filter((m) => m.featured);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Filmes</h1>
        <Link
          href="/admin/movies/new"
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} />
          Novo Filme
        </Link>
      </div>

      {/* Banner info */}
      {featuredMovies.length > 0 ? (
        <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-2 mb-4 text-sm">
          <Star size={14} className="fill-yellow-400 mt-0.5 shrink-0" />
          <span>
            No banner ({featuredMovies.length}): <strong>{featuredMovies.map((m) => m.title).join(", ")}</strong>
            {featuredMovies.length > 1 && " — o carrossel rotaciona entre eles"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-gray-500/10 border border-gray-500/30 text-gray-400 rounded-lg px-4 py-2 mb-4 text-sm">
          <Star size={14} />
          <span>Nenhum filme no banner. Clique na estrela ⭐ de um ou mais filmes para colocá-los no carrossel da home.</span>
        </div>
      )}

      {/* Search */}
      <div className="flex items-center bg-dark-card border border-dark-border rounded-lg px-4 py-2 mb-4">
        <Search size={16} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Buscar filme..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none text-white placeholder-gray-500 w-full text-sm"
        />
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-gray-400 text-left">
                  <th className="px-4 py-3">Filme</th>
                  <th className="px-4 py-3 hidden md:table-cell">Categorias</th>
                  <th className="px-4 py-3 hidden md:table-cell">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Stats</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((movie) => (
                  <tr
                    key={movie.id}
                    className="border-b border-dark-border hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={movie.thumbnail}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-white flex items-center gap-1">
                            {movie.title}
                            {movie.featured && (
                              <Star size={12} className="text-yellow-400 fill-yellow-400" />
                            )}
                          </p>
                          <p className="text-xs text-gray-500">{movie.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {movie.categories.map((c) => (
                          <span
                            key={c.category.name}
                            className="text-xs bg-white/10 px-2 py-0.5 rounded"
                          >
                            {c.category.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          movie.status === "active"
                            ? "bg-green-500/20 text-green-400"
                            : movie.status === "draft"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {movie.status === "active"
                          ? "Ativo"
                          : movie.status === "draft"
                          ? "Rascunho"
                          : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-400 text-xs">
                      {movie._count.favorites} favs · {movie._count.watchProgress} views
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Botão Banner */}
                        <button
                          onClick={() => handleToggleBanner(movie)}
                          disabled={togglingId === movie.id}
                          title={movie.featured ? "Remover do banner" : "Colocar no banner"}
                          className={`p-2 rounded-lg transition ${
                            movie.featured
                              ? "bg-yellow-500/20 hover:bg-yellow-500/30"
                              : "hover:bg-white/10"
                          }`}
                        >
                          <Star
                            size={14}
                            className={
                              movie.featured
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-400"
                            }
                          />
                        </button>

                        <Link
                          href={`/admin/movies/${movie.id}`}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          <Edit size={14} className="text-gray-400" />
                        </Link>
                        <button
                          onClick={() => handleDelete(movie.id, movie.title)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <p>Nenhum filme encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
