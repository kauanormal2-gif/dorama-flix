"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [precisaAssinar, setPrecisaAssinar] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setPrecisaAssinar(false);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/entrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Não foi possível entrar");
        setPrecisaAssinar(Boolean(data.precisaAssinar));
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // O menu flutuante de baixo é `fixed` e cobria o botão "Entrar" no celular:
    // quem tocava no meio do botão acertava o menu. O espaço embaixo resolve.
    <div className="min-h-screen flex items-center justify-center pt-16 pb-32 px-4">
      <div className="w-full max-w-md bg-dark-card rounded-2xl p-8 shadow-xl border border-dark-border">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">
            <span className="text-primary">DRAMA</span>{" "}
            <span className="font-light">FLIX</span>
          </h1>
          <p className="text-gray-300 text-base mt-2">
            Digite o e-mail que você usou na compra
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-base leading-relaxed">
              {error}
              {precisaAssinar && (
                <Link
                  href="/assinar"
                  className="block mt-3 bg-primary hover:bg-primary-hover text-white text-center py-3 rounded-lg font-semibold transition"
                >
                  Ver planos
                </Link>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Seu e-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
              className="w-full bg-dark-lighter border border-dark-border rounded-xl px-4 py-4 text-white text-base placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition"
              placeholder="seu@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 py-4 rounded-xl font-semibold text-base transition"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-base mt-6">
          Ainda não assinou?{" "}
          <Link href="/assinar" className="text-primary hover:underline">
            Ver planos
          </Link>
        </p>
      </div>
    </div>
  );
}
