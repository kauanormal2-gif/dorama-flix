import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        // Verify user is admin before allowing upload
        const user = await getCurrentUser();
        if (!user || user.role !== "admin") {
          throw new Error("Não autorizado");
        }
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/webm",
          ],
        };
      },
      onUploadCompleted: async () => {
        // Nothing needed here
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro no upload";
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
