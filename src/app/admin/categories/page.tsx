"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { movies: number };
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCategories = () => {
    setLoading(true);
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    fetchCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await fetch(`/api/admin/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deletar categoria "${name}"?`)) return;
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Categorias</h1>

      {/* Create */}
      <form onSubmit={handleCreate} className="flex gap-2 mb-6 max-w-md">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Nova categoria..."
          className="flex-1 bg-dark-card border border-dark-border rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-primary transition"
        />
        <button
          type="submit"
          className="flex items-center gap-1 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={14} />
          Criar
        </button>
      </form>

      {/* List */}
      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden max-w-md">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between px-4 py-3 border-b border-dark-border last:border-0 hover:bg-white/5 transition"
            >
              {editingId === cat.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 bg-dark-lighter border border-dark-border rounded px-3 py-1 text-white text-sm focus:outline-none focus:border-primary"
                    autoFocus
                  />
                  <button
                    onClick={() => handleUpdate(cat.id)}
                    className="p-1 hover:bg-green-500/10 rounded"
                  >
                    <Save size={14} className="text-green-400" />
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X size={14} className="text-gray-400" />
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <span className="text-sm text-white">{cat.name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({cat._count.movies} filmes)
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditName(cat.name);
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <Edit size={14} className="text-gray-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition"
                    >
                      <Trash2 size={14} className="text-red-400" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-center py-6 text-gray-500 text-sm">
              Nenhuma categoria
            </p>
          )}
        </div>
      )}
    </div>
  );
}
