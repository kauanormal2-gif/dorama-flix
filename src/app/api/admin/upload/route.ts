import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "image";

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const allowedImages = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideos = ["video/mp4", "video/webm"];

    if (type === "image" && !allowedImages.includes(file.type)) {
      return NextResponse.json({ error: "Formato de imagem inválido. Use JPG ou PNG." }, { status: 400 });
    }

    if (type === "video" && !allowedVideos.includes(file.type)) {
      return NextResponse.json({ error: "Formato de vídeo inválido. Use MP4." }, { status: 400 });
    }

    const folder = type === "video" ? "videos" : "thumbnails";
    const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
    });

    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro ao fazer upload";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
