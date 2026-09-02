import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

const MAX_ITENS = 200;

interface ItemEntrada {
  title?: unknown;
  videoUrl?: unknown;
  thumbnail?: unknown;
  description?: unknown;
  year?: unknown;
}

function urlValida(valor: string): boolean {
  try {
    const u = new URL(valor);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Cadastra vários títulos de uma vez.
 *
 * Entra como rascunho por padrão: assim nada aparece torto no site antes da
 * dona conferir capa e descrição. O botão "Publicar todos" usa o PATCH abaixo.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const itens: ItemEntrada[] = Array.isArray(body.items) ? body.items : [];
    const categoryIds: string[] = Array.isArray(body.categoryIds)
      ? body.categoryIds.filter((id: unknown) => typeof id === "string")
      : [];
    const status = body.status === "active" ? "active" : "draft";

    if (itens.length === 0) {
      return NextResponse.json({ error: "Nenhum item enviado" }, { status: 400 });
    }
    if (itens.length > MAX_ITENS) {
      return NextResponse.json(
        { error: `Envie no máximo ${MAX_ITENS} de cada vez.` },
        { status: 400 }
      );
    }

    // Um retrato dos slugs que já existem, pra não estourar o índice único.
    const existentes = await prisma.movie.findMany({ select: { slug: true } });
    const slugsUsados = new Set(existentes.map((m) => m.slug));

    const criados: { id: string; title: string; slug: string }[] = [];
    const ignorados: { title: string; motivo: string }[] = [];

    for (const item of itens) {
      const title = typeof item.title === "string" ? item.title.trim() : "";
      const videoUrl =
        typeof item.videoUrl === "string" ? item.videoUrl.trim() : "";

      if (!title) {
        ignorados.push({ title: videoUrl || "(sem título)", motivo: "Sem título" });
        continue;
      }
      if (!urlValida(videoUrl)) {
        ignorados.push({ title, motivo: "Link do vídeo inválido" });
        continue;
      }

      const base = slugify(title);
      if (!base) {
        ignorados.push({ title, motivo: "Título sem letras ou números" });
        continue;
      }

      let slug = base;
      let n = 2;
      while (slugsUsados.has(slug)) {
        slug = `${base}-${n}`;
        n++;
      }
      slugsUsados.add(slug);

      const ano = Number(item.year);

      const filme = await prisma.movie.create({
        data: {
          title,
          slug,
          description:
            typeof item.description === "string" && item.description.trim()
              ? item.description.trim()
              : title,
          thumbnail: typeof item.thumbnail === "string" ? item.thumbnail.trim() : "",
          videoUrl,
          year: Number.isInteger(ano) && ano > 1900 ? ano : null,
          status,
          categories: categoryIds.length
            ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
            : undefined,
        },
        select: { id: true, title: true, slug: true },
      });

      criados.push(filme);
    }

    return NextResponse.json({ criados, ignorados }, { status: 201 });
  } catch (err) {
    console.error("Erro na importação em massa:", err);
    return NextResponse.json(
      { error: "Não foi possível importar. Tente de novo." },
      { status: 500 }
    );
  }
}

/** Publica (ou tira do ar) vários títulos de uma vez. */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string")
      : [];
    const status = body.status === "active" ? "active" : "draft";

    if (ids.length === 0) {
      return NextResponse.json({ error: "Nenhum filme informado" }, { status: 400 });
    }

    const { count } = await prisma.movie.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return NextResponse.json({ atualizados: count });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}
