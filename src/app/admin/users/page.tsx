"use client";

import { useState, useEffect } from "react";
import { Trash2, Shield, ShieldOff, KeyRound, Check, Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
  _count: { favorites: number; watchProgress: number };
  watchProgress: {
    updatedAt: string;
    progress: number;
    completed: boolean;
    movie: { title: string };
  }[];
}

function tempoAtras(iso: string) {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (dias === 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

const PLANOS = [
  { valor: "mensal", rotulo: "Mensal", detalhe: "30 dias" },
  { valor: "trimestral", rotulo: "Trimestral", detalhe: "90 dias" },
  { valor: "anual", rotulo: "Anual", detalhe: "1 ano" },
  { valor: "vitalicio", rotulo: "Vitalício", detalhe: "nunca vence" },
];

/** Situação da assinatura em uma frase, do jeito que ela precisa ler. */
function situacao(user: User): {
  texto: string;
  cor: string;
  detalhe?: string;
} {
  if (user.role === "admin") return { texto: "Admin", cor: "text-primary" };
  if (user.subscriptionStatus !== "active")
    return { texto: "Sem acesso", cor: "text-gray-500" };
  if (!user.subscriptionExpiresAt)
    return { texto: "Vitalício", cor: "text-yellow-400" };

  const fim = new Date(user.subscriptionExpiresAt);
  const dias = Math.ceil((fim.getTime() - Date.now()) / 86400000);
  if (dias <= 0) return { texto: "Venceu", cor: "text-red-400" };
  return {
    texto: `${dias} dia${dias > 1 ? "s" : ""}`,
    cor: dias <= 5 ? "text-yellow-400" : "text-green-400",
    detalhe: fim.toLocaleDateString("pt-BR"),
  };
}

/**
 * Liberação manual de acesso.
 *
 * Serve pra quem pagou por fora ou travou no checkout: em vez de mexer no
 * banco na mão, ela digita o e-mail e escolhe o plano.
 */
function LiberarAcesso({ aoLiberar }: { aoLiberar: () => void }) {
  const [email, setEmail] = useState("");
  const [plano, setPlano] = useState("mensal");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const liberar = async () => {
    setErro("");
    setOk("");
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/liberar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plano }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error || "Não deu certo. Tente de novo.");
        return;
      }
      setOk(
        data.venceEm
          ? `${data.criada ? "Conta criada e acesso liberado" : "Acesso liberado"} até ${new Date(data.venceEm).toLocaleDateString("pt-BR")}`
          : `${data.criada ? "Conta criada e acesso" : "Acesso"} liberado pra sempre`
      );
      setEmail("");
      aoLiberar();
    } catch {
      setErro("Erro de conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound size={18} className="text-primary" />
        <h2 className="text-lg font-bold">Liberar acesso na mão</h2>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        Pra quem pagou por fora ou não conseguiu pagar pelo site. Se a conta
        ainda não existir, ela é criada. Se já tiver acesso, os dias são somados.
      </p>

      <label className="block text-sm text-gray-300 mb-1.5">
        E-mail da cliente
      </label>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="maria@gmail.com"
        className="w-full bg-dark-light border border-dark-border rounded-lg px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-primary transition"
      />

      <p className="text-sm text-gray-300 mt-4 mb-1.5">Plano</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PLANOS.map((p) => (
          <button
            key={p.valor}
            type="button"
            onClick={() => setPlano(p.valor)}
            className={`px-3 py-2.5 rounded-lg border text-left transition ${
              plano === p.valor
                ? "border-primary bg-primary/15"
                : "border-dark-border bg-dark-light hover:bg-white/5"
            }`}
          >
            <span className="block text-sm font-semibold text-white">
              {p.rotulo}
            </span>
            <span className="block text-xs text-gray-400">{p.detalhe}</span>
          </button>
        ))}
      </div>

      <button
        onClick={liberar}
        disabled={salvando || !email.trim()}
        className="mt-4 flex items-center justify-center gap-2 w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-base font-semibold transition"
      >
        {salvando ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Check size={18} />
        )}
        Liberar acesso
      </button>

      {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
      {ok && <p className="mt-3 text-sm text-green-400">{ok}</p>}
    </div>
  );
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  // Colaborador libera acesso, mas não promove nem apaga ninguém.
  const [ehAdmin, setEhAdmin] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setEhAdmin(d.user?.role === "admin"))
      .catch(() => {});
  }, []);

  const toggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`${newRole === "admin" ? "Promover" : "Rebaixar"} ${user.name}?`))
      return;
    await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    fetchUsers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deletar usuário "${name}"? Esta ação não pode ser desfeita.`))
      return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    fetchUsers();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Usuários</h1>

      <LiberarAcesso aoLiberar={fetchUsers} />

      {!loading && users.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {(() => {
            const seteDias = Date.now() - 7 * 86400000;
            const entraram = users.filter((u) => u.lastLoginAt);
            const recentes = entraram.filter(
              (u) => new Date(u.lastLoginAt!).getTime() >= seteDias
            );
            const assistiram = users.filter((u) => u._count.watchProgress > 0);
            const cards = [
              { label: "Contas", valor: users.length, cor: "text-white" },
              {
                label: "Já entraram",
                valor: entraram.length,
                cor: "text-blue-400",
              },
              {
                label: "Entraram em 7 dias",
                valor: recentes.length,
                cor: "text-green-400",
              },
              {
                label: "Já assistiram",
                valor: assistiram.length,
                cor: "text-primary",
              },
            ];
            return cards.map((c) => (
              <div
                key={c.label}
                className="bg-dark-card border border-dark-border rounded-xl px-4 py-3"
              >
                <p className={`text-2xl font-bold ${c.cor}`}>{c.valor}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            ));
          })()}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Carregando...</p>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border text-gray-400 text-left">
                  <th className="px-4 py-3">Usuário</th>
                  <th className="px-4 py-3">Acesso</th>
                  <th className="px-4 py-3">Função</th>
                  <th className="px-4 py-3">Assistindo</th>
                  <th className="px-4 py-3">Último acesso</th>
                  <th className="px-4 py-3 hidden md:table-cell">Cadastro</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-dark-border hover:bg-white/5 transition"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {(() => {
                        const s = situacao(user);
                        return (
                          <div>
                            <p className={`font-medium ${s.cor}`}>{s.texto}</p>
                            {s.detalhe && (
                              <p className="text-gray-600">até {s.detalhe}</p>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          user.role === "admin"
                            ? "bg-primary/20 text-primary"
                            : "bg-blue-500/20 text-blue-400"
                        }`}
                      >
                        {user.role === "admin" ? "Admin" : "Usuário"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {user.watchProgress.length > 0 ? (
                        <div>
                          <p className="text-white font-medium truncate max-w-[190px]">
                            {user.watchProgress[0].movie.title}
                          </p>
                          <p className="text-gray-400">
                            {Math.round(user.watchProgress[0].progress)}%
                            {user.watchProgress[0].completed && " · terminou"} ·{" "}
                            {tempoAtras(user.watchProgress[0].updatedAt)}
                          </p>
                          <p className="text-gray-600">
                            {user._count.watchProgress} série
                            {user._count.watchProgress > 1 ? "s" : ""} ·{" "}
                            {user._count.favorites} favs
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-600">Nunca deu play</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {user.lastLoginAt ? (
                        <div>
                          <p className="text-white">
                            {tempoAtras(user.lastLoginAt)}
                          </p>
                          <p className="text-gray-600">
                            {new Date(user.lastLoginAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-red-400/70">Nunca entrou</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!ehAdmin && (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                        {ehAdmin && (
                        <>
                        <button
                          onClick={() => toggleRole(user)}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                          title={
                            user.role === "admin"
                              ? "Rebaixar para usuário"
                              : "Promover a admin"
                          }
                        >
                          {user.role === "admin" ? (
                            <ShieldOff size={14} className="text-yellow-400" />
                          ) : (
                            <Shield size={14} className="text-gray-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                        </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <p className="text-center py-10 text-gray-500">Nenhum usuário</p>
          )}
        </div>
      )}
    </div>
  );
}
