"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Crown,
  CalendarClock,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import NotificationsCard from "@/components/NotificationsCard";
import { linkSuporte, SUPORTE_WHATSAPP_VISIVEL } from "@/lib/suporte";

interface User {
  name: string;
  email: string;
  avatar: string | null;
  role: string;
  subscriptionStatus: string;
  subscriptionExpiresAt: string | null;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function PerfilClient({ user }: { user: User }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const days = useMemo(
    () => daysUntil(user.subscriptionExpiresAt),
    [user.subscriptionExpiresAt]
  );
  const isAdmin = user.role === "admin";
  const isActive =
    isAdmin ||
    (user.subscriptionStatus === "active" && (days === null || days > 0));
  // Avisar com 7 dias deixava o alerta amarelo plantado na tela por uma semana
  // inteira e assustava quem estava em dia. 2 dias é aviso, não pressão.
  const isExpiringSoon = isActive && days !== null && days <= 2;
  const isExpired =
    !isAdmin && user.subscriptionStatus === "active" && days !== null && days <= 0;

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <span className="h-8 w-1 bg-primary rounded-full" />
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          Meu Perfil
        </h1>
      </div>

      {/* Account card */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/40"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-2xl font-bold text-primary">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-white truncate">
              {user.name}
            </h2>
            <p className="text-sm text-gray-400 truncate flex items-center gap-1.5">
              <Mail size={13} />
              {user.email}
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
            <UserIcon size={16} className="text-gray-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">
              Tipo de conta
            </span>
            <span className="ml-auto text-sm font-semibold text-white capitalize">
              {isAdmin ? "Administrador" : "Assinante"}
            </span>
          </div>
        </div>
      </div>

      {/* Plan card */}
      <div
        className={`relative overflow-hidden rounded-3xl p-6 md:p-8 mb-6 border ${
          isActive
            ? "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-primary/30"
            : "bg-white/5 border-white/10"
        }`}
      >
        {isActive && (
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        )}

        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Crown
              size={18}
              className={isActive ? "text-primary" : "text-gray-500"}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Minha Assinatura
            </span>
          </div>

          {isAdmin ? (
            <>
              <h3 className="text-2xl font-extrabold text-white mb-2">
                Acesso ilimitado
              </h3>
              <p className="text-sm text-gray-300">
                Sua conta de administrador tem acesso a todo o catálogo, sem
                data de expiração.
              </p>
            </>
          ) : isActive ? (
            <>
              <h3 className="text-2xl font-extrabold text-white mb-1 flex items-center gap-2">
                Ativa
                <CheckCircle2 size={20} className="text-green-400" />
              </h3>
              <p className="text-sm text-gray-300 mb-5">
                Você tem acesso a todo o catálogo do Drama Flix.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <CalendarClock size={12} />
                    Renova em
                  </div>
                  <p className="text-lg font-bold text-white">
                    {formatDate(user.subscriptionExpiresAt)}
                  </p>
                </div>
                <div className="bg-black/30 border border-white/10 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                    <Sparkles size={12} />
                    Tempo restante
                  </div>
                  <p className="text-lg font-bold text-white">
                    {days === null
                      ? "Ilimitado"
                      : days === 1
                      ? "1 dia"
                      : `${days} dias`}
                  </p>
                </div>
              </div>

              {isExpiringSoon && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
                  <AlertTriangle
                    size={18}
                    className="text-amber-400 flex-shrink-0 mt-0.5"
                  />
                  <div className="text-sm">
                    <p className="text-amber-200 font-semibold mb-0.5">
                      Sua assinatura vence em breve
                    </p>
                    <p className="text-amber-200/70 text-xs">
                      Renove agora para não perder o acesso.
                    </p>
                  </div>
                </div>
              )}

              <Link
                href="/assinar"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-full font-semibold text-sm transition shadow-[0_10px_30px_-10px_rgba(229,9,20,0.7)]"
              >
                <RefreshCw size={16} />
                Renovar assinatura
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-2xl font-extrabold text-white mb-1">
                {isExpired ? "Assinatura expirada" : "Sem assinatura ativa"}
              </h3>
              <p className="text-sm text-gray-300 mb-5">
                {isExpired
                  ? `Sua assinatura venceu em ${formatDate(user.subscriptionExpiresAt)}. Renove para voltar a assistir.`
                  : "Assine agora e tenha acesso ilimitado a todo o catálogo."}
              </p>
              <Link
                href="/assinar"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-6 py-3 rounded-full font-semibold text-sm transition shadow-[0_10px_30px_-10px_rgba(229,9,20,0.7)]"
              >
                <Crown size={16} />
                Ver planos
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Notifications */}
      <NotificationsCard />

      {/* Suporte */}
      <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-12 h-12 rounded-full bg-[#25D366]/15 flex items-center justify-center flex-shrink-0">
            <MessageCircle size={24} className="text-[#25D366]" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-white">Precisa de ajuda?</p>
            <p className="text-base text-gray-300">
              A gente responde no WhatsApp {SUPORTE_WHATSAPP_VISIVEL}
            </p>
          </div>
        </div>

        <a
          href={linkSuporte(user.name)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1fb955] text-white text-lg font-semibold px-6 py-4 rounded-2xl transition"
        >
          <MessageCircle size={22} strokeWidth={2.4} />
          Chamar no WhatsApp
        </a>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {isAdmin && (
          <Link
            href="/admin"
            className="flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 transition"
          >
            <span className="text-sm font-medium text-white">
              Painel administrativo
            </span>
            <span className="text-xs text-gray-400">→</span>
          </Link>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl px-5 py-4 transition text-sm font-medium text-white disabled:opacity-50"
        >
          <LogOut size={16} />
          {loggingOut ? "Saindo…" : "Sair da conta"}
        </button>
      </div>
    </div>
  );
}
