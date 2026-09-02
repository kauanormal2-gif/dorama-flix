import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { enviarPush } from "@/lib/push-server";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 100) : "";
  const message = typeof body?.body === "string" ? body.body.trim().slice(0, 300) : "";
  const url = typeof body?.url === "string" ? body.url.slice(0, 500) : "/";
  const image = typeof body?.image === "string" ? body.image.slice(0, 500) : undefined;

  if (!title || !message) {
    return NextResponse.json({ error: "title e body são obrigatórios" }, { status: 400 });
  }

  const r = await enviarPush({ title, body: message, url, image });
  if (!r.ok) {
    return NextResponse.json({ error: r.erro }, { status: 500 });
  }

  return NextResponse.json(r);
}
