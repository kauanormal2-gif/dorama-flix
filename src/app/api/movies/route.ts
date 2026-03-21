import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const featured = searchParams.get("featured");

  const where: Record<string, unknown> = { status: "active" };

  if (search) {
    where.title = { contains: search };
  }

  if (category) {
    where.categories = { some: { category: { slug: category } } };
  }

  if (featured === "true") {
    where.featured = true;
  }

  const movies = await prisma.movie.findMany({
    where,
    include: { categories: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ movies });
}
