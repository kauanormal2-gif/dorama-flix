"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";

interface Settings {
  siteName: string;
  siteTagline: string;
  logoUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  primaryColor: string;
}

export default function AdminSettings() {
  const [form, setForm] = useState<Settings>({
    siteName: "Dorama Flix",
    siteTagline: "Filmes e Séries Asiáticas",
    logoUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    primaryColor: "#e50914",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) {
          setForm({
            siteName: d.settings.siteName || "Dorama Flix",
            siteTagline: d.settings.siteTagline || "",
            logoUrl: d.settings.logoUrl || "",
            heroTitle: d.settings.heroTitle || "",
            heroSubtitle: d.settings.heroSubtitle || "",
            primaryColor: d.settings.primaryColor || "#e50914",
          });
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Configurações do Site</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Nome do Site
          </label>
          <input
            type="text"
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">Tagline</label>
          <input
            type="text"
            value={form.siteTagline}
            onChange={(e) => setForm({ ...form, siteTagline: e.target.value })}
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            URL do Logo (opcional)
          </label>
          <input
            type="url"
            value={form.logoUrl || ""}
            onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            placeholder="https://..."
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Título do Hero
          </label>
          <input
            type="text"
            value={form.heroTitle || ""}
            onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Subtítulo do Hero
          </label>
          <input
            type="text"
            value={form.heroSubtitle || ""}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
            className="w-full bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Cor Principal
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              className="w-12 h-12 rounded-lg border border-dark-border cursor-pointer"
            />
            <input
              type="text"
              value={form.primaryColor}
              onChange={(e) =>
                setForm({ ...form, primaryColor: e.target.value })
              }
              className="bg-dark-card border border-dark-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition w-32"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 px-6 py-3 rounded-lg font-semibold transition"
          >
            <Save size={16} />
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {saved && (
            <span className="text-green-400 text-sm animate-fade-in">
              Salvo com sucesso!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
