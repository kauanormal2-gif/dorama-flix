"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing } from "lucide-react";
import {
  isPushSupported,
  getPermissionState,
  getExistingSubscription,
  subscribePush,
  unsubscribePush,
} from "@/lib/push";

export default function NotificationsCard() {
  const [supported, setSupported] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const sup = isPushSupported();
    setSupported(sup);
    if (!sup) return;
    setPermission(getPermissionState());
    getExistingSubscription().then((s) => setSubscribed(!!s));
  }, []);

  const handleEnable = async () => {
    setBusy(true);
    setMsg(null);
    const res = await subscribePush();
    if (res.ok) {
      setSubscribed(true);
      setPermission("granted");
      setMsg("Notificações ativadas!");
    } else {
      setMsg(res.error || "Falha ao ativar");
    }
    setBusy(false);
  };

  const handleDisable = async () => {
    setBusy(true);
    setMsg(null);
    const res = await unsubscribePush();
    if (res.ok) {
      setSubscribed(false);
      setMsg("Notificações desativadas.");
    } else {
      setMsg(res.error || "Falha ao desativar");
    }
    setBusy(false);
  };

  if (!supported) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <BellOff size={18} className="text-gray-500" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Notificações
          </h3>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          Seu dispositivo não suporta notificações push. Instale o app na tela inicial e tente
          novamente.
        </p>
      </div>
    );
  }

  const denied = permission === "denied";

  return (
    <div className="bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 md:p-8 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <BellRing size={18} className={subscribed ? "text-primary" : "text-gray-500"} />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Notificações
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-1">
        {subscribed ? "Você está inscrita" : "Receba avisos de novos episódios"}
      </h3>
      <p className="text-sm text-gray-300 mb-5">
        {subscribed
          ? "Enviaremos notificações quando novos doramas forem adicionados."
          : "Ative para receber avisos no seu celular quando lançarmos novidades."}
      </p>

      {denied && !subscribed && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4 text-sm text-amber-200">
          As notificações foram bloqueadas. Habilite nas configurações do navegador ou do app.
        </div>
      )}

      {subscribed ? (
        <button
          onClick={handleDisable}
          disabled={busy}
          className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 px-5 py-3 rounded-full font-semibold text-sm transition disabled:opacity-50"
        >
          <BellOff size={16} />
          {busy ? "Removendo…" : "Desativar notificações"}
        </button>
      ) : (
        <button
          onClick={handleEnable}
          disabled={busy || denied}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover px-5 py-3 rounded-full font-semibold text-sm transition shadow-[0_10px_30px_-10px_rgba(229,9,20,0.7)] disabled:opacity-50"
        >
          <Bell size={16} />
          {busy ? "Ativando…" : "Ativar notificações"}
        </button>
      )}

      {msg && <p className="text-xs text-gray-400 mt-3">{msg}</p>}
    </div>
  );
}
