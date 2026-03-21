import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let settings = await prisma.siteSettings.findUnique({ where: { id: "main" } });

  if (!settings) {
    settings = await prisma.siteSettings.create({
      data: { id: "main" },
    });
  }

  return NextResponse.json({ settings });
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();

  const settings = await prisma.siteSettings.upsert({
    where: { id: "main" },
    update: body,
    create: { id: "main", ...body },
  });

  return NextResponse.json({ settings });
}
