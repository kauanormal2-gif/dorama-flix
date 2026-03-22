import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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
