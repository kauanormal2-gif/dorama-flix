"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import {
  isPushSupported,
  getPermissionState,
  getExistingSubscription,
  subscribePush,
} from "@/lib/push";

const JA_PERGUNTOU = "dramaflix_avisos_perguntado";

/**
 * Convite pra ligar as notificações, mostrado no primeiro acesso.
 *
 * Só aparece pra quem ainda não decidiu nada (nem permitiu, nem bloqueou) e
 * some pra sempre depois que a pessoa responde — não insiste.
 *
 * Quem já está inscrita não vê nada: em vez disso o componente reenvia a
 * inscrição em silêncio, o que atualiza o "visto por último" no banco. É esse
 * carimbo que o lembrete automático usa pra saber quem sumiu do app.
 */
export default function PedirAvisos() {
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;

    getExistingSubscription().then((sub) => {
      if (sub) {
        // Já inscrita: só carimba o "visto por último".
        fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        }).catch(() => {});
        return;
      }

      if (getPermissionState() !== "default") return;
      if (localStorage.getItem(JA_PERGUNTOU)) return;

      // Deixa a pessoa ver o site antes de pedir qualquer coisa.
      const t = setTimeout(() => setAberto(true), 4000);
      return () => clearTimeout(t);
    });
  }, []);

  const fechar = () => {
    localStorage.setItem(JA_PERGUNTOU, "1");
    setAberto(false);
  };

  const ativar = async () => {
    setOcupado(true);
    await subscribePush();
    localStorage.setItem(JA_PERGUNTOU, "1");
    setOcupado(false);
    setAberto(false);
  };

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md bg-dark border border-white/15 rounded-3xl p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
          <Bell size={28} className="text-primary" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Quer saber quando entrar série nova?
        </h2>
        <p className="text-base text-gray-300 mb-7">
          A gente te avisa no celular assim que um dorama novo chegar. Sem
          propaganda, só as novidades.
        </p>

        <button
          onClick={ativar}
          disabled={ocupado}
          className="w-full bg-primary hover:bg-primary-hover text-white text-lg font-semibold px-6 py-4 rounded-2xl transition disabled:opacity-50"
        >
          {ocupado ? "Ativando…" : "Sim, quero ser avisada"}
        </button>
        <button
          onClick={fechar}
          className="w-full text-base text-gray-400 hover:text-white px-6 py-3 mt-2 transition"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
