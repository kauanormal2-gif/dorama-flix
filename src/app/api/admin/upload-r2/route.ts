import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { requireAdmin } from "@/lib/auth";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

// Gera URL assinada para upload direto do navegador pro R2
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileName, contentType } = await req.json();

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "fileName e contentType são obrigatórios" }, { status: 400 });
  }

  // Sanitiza o nome do arquivo
  const safeName = fileName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9.\-_]/g, "");

  const key = `videos/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.CLOUDFLARE_R2_BUCKET!,
    Key: key,
    ContentType: contentType,
  });

  // URL válida por 1 hora
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
  const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ signedUrl, publicUrl, key });
}
