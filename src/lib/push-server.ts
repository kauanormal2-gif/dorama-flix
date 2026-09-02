import webpush from "web-push";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type Aviso = {
  title: string;
  body: string;
  url?: string;
  image?: string;
  tag?: string;
};

function configurar() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:noreply@drama-flix.com";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

/**
 * Dispara um aviso pra quem autorizou notificação no celular/navegador.
 * Sem `filtro`, vai pra todo mundo.
 *
 * Quem desinstalou o app ou revogou a permissão devolve 404/410 — esses são
 * apagados do banco na hora, pra lista não encher de endereço morto.
 */
export async function enviarPush(
  aviso: Aviso,
  filtro?: Prisma.PushSubscriptionWhereInput
) {
  if (!configurar()) {
    return { ok: false as const, erro: "VAPID não configurado" };
  }

  const subs = await prisma.pushSubscription.findMany({ where: filtro });
  const payload = JSON.stringify({
    title: aviso.title,
    body: aviso.body,
    url: aviso.url || "/",
    image: aviso.image,
    tag: aviso.tag,
  });

  let sent = 0;
  const mortos: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) mortos.push(s.endpoint);
      }
    })
  );

  let removed = 0;
  if (mortos.length > 0) {
    const r = await prisma.pushSubscription.deleteMany({
      where: { endpoint: { in: mortos } },
    });
    removed = r.count;
  }

  return { ok: true as const, total: subs.length, sent, removed };
}
