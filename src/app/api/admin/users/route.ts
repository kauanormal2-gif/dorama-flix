import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireEquipe } from "@/lib/equipe-server";

export async function GET() {
  try {
    await requireEquipe();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      lastLoginAt: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      _count: { select: { favorites: true, watchProgress: true } },
      // Última série que a pessoa assistiu — é isso que diz se ela usa o app
      watchProgress: {
        orderBy: { updatedAt: "desc" },
        take: 1,
        select: {
          updatedAt: true,
          progress: true,
          completed: true,
          movie: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ users });
}
