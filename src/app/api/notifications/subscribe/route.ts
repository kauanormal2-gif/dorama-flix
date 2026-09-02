import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = typeof body?.endpoint === "string" ? body.endpoint : null;
    const p256dh = body?.keys?.p256dh;
    const auth = body?.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
    }

    const user = await getCurrentUser();
    const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh,
        auth,
        userId: user?.id ?? null,
        userAgent,
        lastUsed: new Date(),
      },
      create: {
        endpoint,
        p256dh,
        auth,
        userId: user?.id ?? null,
        userAgent,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[notifications/subscribe]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
