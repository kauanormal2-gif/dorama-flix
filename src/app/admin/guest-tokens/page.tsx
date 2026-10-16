"use client";

import { useState, useEffect } from "react";
import { Copy, Trash2, Plus, Check, Link as LinkIcon } from "lucide-react";

interface GuestToken {
  id: string;
  token: string;
  label: string;
  durationDays: number;
  expiresAt: string | null;
  diasDeAcesso: number | null;
  active: boolean;
  createdAt: string;
  movieId: string | null;
  movie: { title: string; slug: string } | null;
}

interface SerieOpcao {
  id: string;
  title: string;
}

// Precisa bater com a lista aceita em /api/admin/guest-tokens
const DURACOES = [3, 7, 14, 30, 90, 365];

export default function GuestTokensPage() {
  const [tokens, setTokens] = useState<GuestToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [series, setSeries] = useState<SerieOpcao[]>([]);
  const [movieId, setMovieId] = useState("");
  const [erro, setErro] = useState("");
  const [prazoRolante, setPrazoRolante] = useState(false);

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "";

  useEffect(() => {
    fetchTokens();
    // Só séries no ar entram na lista — convite pra rascunho abriria em branco.
    fetch("/api/admin/movies")
      .then((r) => r.json())
      .then((d) =>
        setSeries(
          (d.movies || [])
            .filter((m: { status: string }) => m.status === "active")
            // Tem título gravado com espaço na frente, e isso jogava a série
            // pro topo da lista como se começasse antes do "A".
            .map((m: SerieOpcao) => ({ id: m.id, title: m.title.trim() }))
            .sort((a: SerieOpcao, b: SerieOpcao) =>
              a.title.localeCompare(b.title, "pt-BR")
            )
        )
      )
      .catch(() => {});
  }, []);

  async function fetchTokens() {
    setLoading(true);
    const res = await fetch("/api/admin/guest-tokens");
    const data = await res.json();
    setTokens(data.tokens || []);
    setLoading(false);
  }

  async function createToken(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setCreating(true);
    setErro("");
    const res = await fetch("/api/admin/guest-tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label,
        durationDays,
        movieId: movieId || null,
        prazoRolante,
      }),
    });
    if (res.ok) {
      setLabel("");
      setMovieId("");
      setShowForm(false);
      await fetchTokens();
    } else {
      const d = await res.json().catch(() => ({}));
      setErro(d.error || "Não deu certo. Tente de novo.");
    }
    setCreating(false);
  }

  async function deleteToken(id: string) {
    if (!confirm("Desativar este link?")) return;
    await fetch(`/api/admin/guest-tokens/${id}`, { method: "DELETE" });
    await fetchTokens();
  }

  function copyLink(token: string, id: string) {
    navigator.clipboard.writeText(`${appUrl}/convite/${token}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const active = tokens.filter(
    (t) => t.active && (!t.expiresAt || new Date(t.expiresAt) > new Date())
  );
  const inactive = tokens.filter(
    (t) => !t.active || (!!t.expiresAt && new Date(t.expiresAt) <= new Date())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Links de Convidado</h1>
          <p className="text-gray-400 text-sm mt-1">
            Crie links de acesso temporário sem precisar de login ou assinatura.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          <Plus size={16} />
          Novo Link
        </button>
      </div>

      {/* Formulário de criação */}
      {showForm && (
        <form
          onSubmit={createToken}
          className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6"
        >
          <h2 className="font-semibold mb-4">Criar novo link de convidado</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Nome / Identificação do link
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: Influencer Ana - Janeiro"
                required
                className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                O que esse link libera
              </label>
              <select
                value={movieId}
                onChange={(e) => setMovieId(e.target.value)}
                className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-base text-white focus:outline-none focus:border-primary transition"
              >
                <option value="">Catálogo inteiro</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id}>
                    Só a série: {s.title}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Escolhendo uma série, o link abre direto nela e não dá acesso ao
                resto do catálogo.
              </p>
            </div>
            <div>
              <label className="flex items-start gap-3 bg-dark border border-dark-border rounded-lg p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prazoRolante}
                  onChange={(e) => setPrazoRolante(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-primary flex-shrink-0"
                />
                <span>
                  <span className="block text-base font-semibold text-white">
                    Mandar pra quantas pessoas eu quiser
                  </span>
                  <span className="block text-sm text-gray-400 mt-0.5">
                    O link nunca vence. Cada pessoa que abrir ganha o prazo
                    abaixo contado a partir do dia dela.
                  </span>
                </span>
              </label>
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-2">
                {prazoRolante ? "Quanto tempo cada pessoa ganha" : "Duração do acesso"}
              </label>
              <div className="flex gap-3">
                {DURACOES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDurationDays(d)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
                      durationDays === d
                        ? "bg-primary text-white"
                        : "bg-dark border border-dark-border text-gray-400 hover:border-primary/50"
                    }`}
                  >
                    {d === 365 ? "1 ano" : d === 90 ? "3 meses" : d === 30 ? "1 mês" : `${d} dias`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-primary hover:bg-primary-hover disabled:opacity-50 px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                {creating ? "Criando..." : "Criar Link"}
              </button>
              {erro && (
                <p className="self-center text-sm text-red-400">{erro}</p>
              )}
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-lg text-sm font-medium transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de links ativos */}
      {loading ? (
        <p className="text-gray-500 text-sm">Carregando...</p>
      ) : (
        <div className="space-y-6">
          {/* Ativos */}
          <div>
            <h2 className="text-sm text-gray-400 uppercase tracking-wider mb-3">
              Ativos ({active.length})
            </h2>
            {active.length === 0 ? (
              <p className="text-gray-600 text-sm">Nenhum link ativo.</p>
            ) : (
              <div className="space-y-3">
                {active.map((t) => (
                  <div
                    key={t.id}
                    className="bg-dark-card border border-dark-border rounded-xl p-4 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <LinkIcon size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">{t.label}</p>
                      <p className="text-xs mt-0.5 truncate">
                        {t.movie ? (
                          <span className="text-primary">
                            Só a série: {t.movie.title}
                          </span>
                        ) : (
                          <span className="text-gray-500">Catálogo inteiro</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.diasDeAcesso
                          ? `${t.diasDeAcesso} dias por pessoa · vale pra quantas quiser`
                          : t.expiresAt
                            ? `${t.durationDays} dias · Expira em ${new Date(t.expiresAt).toLocaleDateString("pt-BR")}`
                            : "Link fixo · não vence"}
                      </p>
                      <p className="text-xs text-gray-600 font-mono truncate mt-0.5">
                        {appUrl}/convite/{t.token}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => copyLink(t.token, t.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                        title="Copiar link"
                      >
                        {copiedId === t.id ? (
                          <Check size={15} className="text-green-400" />
                        ) : (
                          <Copy size={15} />
                        )}
                      </button>
                      <button
                        onClick={() => deleteToken(t.id)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition"
                        title="Desativar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inativos / Expirados */}
          {inactive.length > 0 && (
            <div>
              <h2 className="text-sm text-gray-600 uppercase tracking-wider mb-3">
                Expirados / Desativados ({inactive.length})
              </h2>
              <div className="space-y-2">
                {inactive.map((t) => (
                  <div
                    key={t.id}
                    className="bg-dark-card/50 border border-dark-border/50 rounded-xl p-3 flex items-center gap-3 opacity-50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-400 truncate">{t.label}</p>
                      <p className="text-xs text-gray-600">
                        {t.expiresAt
                          ? `${t.durationDays} dias · Expirou em ${new Date(t.expiresAt).toLocaleDateString("pt-BR")}`
                          : "Link fixo · desativado"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
