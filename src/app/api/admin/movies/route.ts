import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const movies = await prisma.movie.findMany({
    include: {
      categories: { include: { category: true } },
      _count: { select: { favorites: true, watchProgress: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ movies });
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, thumbnail, videoUrl, bannerUrl, year, duration, rating, featured, status, categoryIds } = body;

    if (!title || !description || !thumbnail || !videoUrl) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 });
    }

    const slug = slugify(title);

    const movie = await prisma.movie.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        videoUrl,
        bannerUrl: bannerUrl || null,
        year: year ? parseInt(year) : null,
        duration: duration || null,
        rating: rating ? parseFloat(rating) : null,
        featured: featured || false,
        status: status || "active",
        categories: categoryIds?.length
          ? { create: categoryIds.map((id: string) => ({ categoryId: id })) }
          : undefined,
      },
      include: { categories: { include: { category: true } } },
    });

    return NextResponse.json({ movie }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar filme" }, { status: 500 });
  }
}
