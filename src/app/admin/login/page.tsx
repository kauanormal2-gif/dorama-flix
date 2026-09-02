"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";
import { ehDaEquipe } from "@/lib/equipe";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "E-mail ou senha incorretos");
        return;
      }

      // Esta porta abre pra admin E colaborador. Cliente é deslogada na hora.
      if (!ehDaEquipe(data.user.role)) {
        await fetch("/api/auth/logout", { method: "POST" });
        setError("Essa conta não tem acesso ao painel.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente de novo.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-dark-lighter border border-dark-border rounded-xl px-4 py-3.5 text-white text-base placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition";

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark px-4 py-10">
      <div className="w-full max-w-md bg-dark-card rounded-2xl p-8 shadow-xl border border-dark-border">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            <span className="text-primary">DRAMA</span>{" "}
            <span className="font-light">FLIX</span>
          </h1>
          <p className="text-gray-300 text-base mt-2">Painel do administrador</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-200 px-4 py-3 rounded-xl text-sm leading-relaxed">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className={inputClass}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full bg-primary hover:bg-primary-hover disabled:opacity-50 py-4 rounded-xl font-semibold text-base transition"
          >
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            {loading ? "Entrando..." : "Entrar no painel"}
          </button>
        </form>
      </div>
    </div>
  );
}
