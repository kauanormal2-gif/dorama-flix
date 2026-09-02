"use client";

import { useState } from "react";
import { Bell, Send, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AdminNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [image, setImage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<
    | { ok: true; total: number; sent: number; removed: number }
    | { ok: false; error: string }
    | null
  >(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || "/",
          image: image.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, error: data?.error || "Erro" });
      } else {
        setResult({ ok: true, total: data.total, sent: data.sent, removed: data.removed });
        setTitle("");
        setBody("");
      }
    } catch (err) {
      setResult({ ok: false, error: "Falha de rede" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Bell size={22} className="text-primary" />
        <h1 className="text-2xl font-bold text-white">Enviar Notificação Push</h1>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Envia notificação para <strong>todas</strong> as pessoas que ativaram notificações no
        Drama Flix.
      </p>

      <form
        onSubmit={handleSend}
        className="bg-dark-card border border-dark-border rounded-2xl p-6 space-y-4"
      >
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Título <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            required
            placeholder="Ex: Novo episódio disponível!"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
          />
          <p className="text-[10px] text-gray-500 mt-1">{title.length}/100</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Mensagem <span className="text-primary">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={300}
            required
            rows={3}
            placeholder="Ex: O novo dorama X já está no ar. Assista agora!"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none resize-none"
          />
          <p className="text-[10px] text-gray-500 mt-1">{body.length}/300</p>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Link ao clicar
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/filme/algum-slug"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Imagem (opcional)
          </label>
          <input
            type="url"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://…"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold text-sm transition"
        >
          <Send size={16} />
          {sending ? "Enviando…" : "Enviar para todos"}
        </button>
      </form>

      {result && (
        <div
          className={`mt-4 rounded-2xl border p-4 flex items-start gap-3 ${
            result.ok
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          {result.ok ? (
            <>
              <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-200">
                <p className="font-semibold">Enviado!</p>
                <p className="text-xs text-green-200/70 mt-0.5">
                  {result.sent} entregues de {result.total} inscritos
                  {result.removed > 0 && ` · ${result.removed} inscrições inválidas removidas`}
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">
                <p className="font-semibold">Erro ao enviar</p>
                <p className="text-xs text-red-200/70 mt-0.5">{result.error}</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
