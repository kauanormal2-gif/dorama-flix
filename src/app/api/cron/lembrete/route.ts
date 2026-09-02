import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { enviarPush } from "@/lib/push-server";

/** Só avisa quem não abre o app há esse tanto de dias. */
const DIAS_SUMIDA = 5;

/**
 * Lembrete automático, disparado pela Vercel às terças e sextas (ver vercel.json).
 *
 * Chama a atenção só de quem sumiu, citando o dorama mais recente do catálogo —
 * quem está usando o app toda semana não recebe nada.
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const corte = new Date(Date.now() - DIAS_SUMIDA * 24 * 60 * 60 * 1000);

  const novidade = await prisma.movie.findFirst({
    where: { status: "active" },
    orderBy: { createdAt: "desc" },
    select: { title: true, slug: true, thumbnail: true },
  });

  const r = await enviarPush(
    {
      title: "Sentimos sua falta no Drama Flix",
      body: novidade
        ? `Tem novidade esperando: ${novidade.title}. Vem assistir!`
        : "Tem dorama novo esperando por você. Vem assistir!",
      url: novidade ? `/filme/${novidade.slug}` : "/",
      image: novidade?.thumbnail,
      tag: "lembrete",
    },
    { lastUsed: { lt: corte } }
  );

  return NextResponse.json(r);
}
