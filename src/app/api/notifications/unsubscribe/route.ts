import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    if (!endpoint) return NextResponse.json({ error: "endpoint obrigatório" }, { status: 400 });

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[notifications/unsubscribe]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
