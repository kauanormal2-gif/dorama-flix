import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { enviarPush } from "@/lib/push-server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, thumbnail, videoUrl, bannerUrl, year, duration, rating, featured, status, categoryIds } = body;

    // Como era antes de mexer — precisamos saber se ela estava em rascunho.
    const antes = await prisma.movie.findUnique({
      where: { id },
      select: { status: true },
    });

    // Delete old category relations
    await prisma.movieCategory.deleteMany({ where: { movieId: id } });

    const movie = await prisma.movie.update({
      where: { id },
      data: {
        title,
        slug: title ? slugify(title) : undefined,
        description,
        thumbnail,
        videoUrl,
        bannerUrl: bannerUrl || null,
        year: year ? parseInt(year) : null,
        duration: duration || null,
        rating: rating ? parseFloat(rating) : null,
        featured: featured ?? undefined,
        status: status || undefined,
        categories: categoryIds?.length
          ? { create: categoryIds.map((cid: string) => ({ categoryId: cid })) }
          : undefined,
      },
      include: { categories: { include: { category: true } } },
    });

    // Série que sai do rascunho é série nova pra quem assiste — avisa igual ao
    // cadastro. Sem isto, tudo que ela publicava depois entrava em silêncio.
    if (antes && antes.status !== "active" && movie.status === "active") {
      try {
        await enviarPush({
          title: "Nova série no Drama Flix",
          body: `${movie.title} já está disponível. Vem assistir!`,
          url: `/filme/${movie.slug}`,
          image: movie.thumbnail,
          tag: `serie-${movie.slug}`,
        });
      } catch {
        // não bloqueia a edição
      }
    }

    return NextResponse.json({ movie });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar filme" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();

    const movie = await prisma.movie.update({
      where: { id },
      data: { featured: body.featured },
    });

    return NextResponse.json({ movie });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.movie.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
