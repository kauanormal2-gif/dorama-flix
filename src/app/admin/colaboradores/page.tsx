"use client";

import { useState, useEffect } from "react";
import { UserPlus, Loader2, Check, ShieldOff, Crown } from "lucide-react";

interface Membro {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
  createdAt: string;
}

const PODE = [
  "Liberar acesso de cliente que pagou",
  "Copiar o link de divulgação das séries",
  "Ver a lista de clientes e quanto falta da assinatura",
];

const NAO_PODE = [
  "Ver o faturamento",
  "Cadastrar, editar ou apagar séries",
  "Apagar clientes ou criar outros colaboradores",
  "Mexer nas configurações e nas notificações",
];

export default function AdminColaboradores() {
  const [equipe, setEquipe] = useState<Membro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");

  const buscar = () => {
    setCarregando(true);
    fetch("/api/admin/colaboradores")
      .then((r) => r.json())
      .then((d) => setEquipe(d.equipe || []))
      .finally(() => setCarregando(false));
  };

  useEffect(buscar, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setOk("");
    setSalvando(true);
    try {
      const res = await fetch("/api/admin/colaboradores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErro(d.error || "Não deu certo. Tente de novo.");
        return;
      }
      setOk(
        `${d.colaborador.nome} já pode entrar no painel com o e-mail ${d.colaborador.email} e a senha que você criou.`
      );
      setNome("");
      setEmail("");
      setSenha("");
      buscar();
    } catch {
      setErro("Erro de conexão. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  const tirarAcesso = async (m: Membro) => {
    if (!confirm(`Tirar o acesso de ${m.name} ao painel?`)) return;
    const res = await fetch(`/api/admin/colaboradores/${m.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      alert(d.error || "Não deu certo.");
      return;
    }
    buscar();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Colaboradores</h1>
      <p className="text-sm text-gray-400 mb-6">
        Quem pode entrar no painel pra te ajudar no dia a dia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <p className="text-sm font-semibold text-green-400 mb-3">
            O colaborador PODE
          </p>
          <ul className="space-y-2">
            {PODE.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-gray-200">
                <Check size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <p className="text-sm font-semibold text-red-400 mb-3">
            O colaborador NÃO pode
          </p>
          <ul className="space-y-2">
            {NAO_PODE.map((t) => (
              <li key={t} className="flex gap-2 text-sm text-gray-400">
                <ShieldOff size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <form
        onSubmit={criar}
        className="bg-dark-card border border-dark-border rounded-xl p-5 mb-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={18} className="text-primary" />
          <h2 className="text-lg font-bold">Novo colaborador</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ana"
              className="w-full bg-dark-light border border-dark-border rounded-lg px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ana@gmail.com"
              className="w-full bg-dark-light border border-dark-border rounded-lg px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1.5">
              Senha que ela vai usar
            </label>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="mínimo 8 letras ou números"
              className="w-full bg-dark-light border border-dark-border rounded-lg px-4 py-3 text-base text-white placeholder-gray-600 focus:outline-none focus:border-primary transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={salvando || !nome.trim() || !email.trim() || !senha}
          className="mt-4 flex items-center justify-center gap-2 w-full md:w-auto bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed px-6 py-3 rounded-lg text-base font-semibold transition"
        >
          {salvando ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
          Criar acesso
        </button>

        {erro && <p className="mt-3 text-sm text-red-400">{erro}</p>}
        {ok && <p className="mt-3 text-sm text-green-400">{ok}</p>}

        <p className="mt-4 text-sm text-gray-500">
          Ela entra por <strong className="text-gray-300">/admin</strong> com esse
          e-mail e senha. Passe a senha pra ela por WhatsApp.
        </p>
      </form>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-gray-400 text-left">
                <th className="px-4 py-3">Pessoa</th>
                <th className="px-4 py-3">Acesso</th>
                <th className="px-4 py-3">Último login</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipe.map((m) => (
                <tr key={m.id} className="border-b border-dark-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    {m.role === "admin" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                        <Crown size={12} />
                        Dona (vê tudo)
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        Colaborador
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {m.lastLoginAt
                      ? new Date(m.lastLoginAt).toLocaleDateString("pt-BR")
                      : "nunca entrou"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.role === "colaborador" && (
                      <button
                        onClick={() => tirarAcesso(m)}
                        className="text-sm px-3 py-2 rounded-lg bg-white/10 hover:bg-red-500/20 hover:text-red-400 transition"
                      >
                        Tirar acesso
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!carregando && equipe.length === 0 && (
          <p className="text-center py-10 text-gray-500">Ninguém ainda</p>
        )}
        {carregando && (
          <p className="text-center py-10 text-gray-500">Carregando...</p>
        )}
      </div>
    </div>
  );
}
