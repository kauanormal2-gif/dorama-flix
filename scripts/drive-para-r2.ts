/**
 * Move os vídeos que ainda estão no Google Drive para o R2.
 *
 * O arquivo NÃO passa pelo disco: ele é lido do Drive e escrito no R2 ao mesmo
 * tempo (stream), então não enche o HD nem importa o tamanho do vídeo.
 *
 * Uso (de dentro da pasta do projeto):
 *   npx tsx -r dotenv/config scripts/drive-para-r2.ts --dry        # só lista
 *   npx tsx -r dotenv/config scripts/drive-para-r2.ts --limit 3    # move 3
 *   npx tsx -r dotenv/config scripts/drive-para-r2.ts              # move tudo
 *
 * É seguro parar no meio (Ctrl+C) e rodar de novo: quem já foi é pulado, e o
 * link antigo do Drive fica guardado em backup-drive-urls.json.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "node:stream";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET!;
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
const BACKUP = join(process.cwd(), "backup-drive-urls.json");

const args = process.argv.slice(2);
const soListar = args.includes("--dry");
const limite = Number(args[args.indexOf("--limit") + 1]) || Infinity;

function gb(bytes: number) {
  return (bytes / 1024 ** 3).toFixed(2);
}

function duracao(ms: number) {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}min ${s % 60}s`;
}

function idDoDrive(url: string): string | null {
  return url.match(/\/d\/([^/?]+)/)?.[1] ?? null;
}

function linkDireto(fileId: string) {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

async function main() {
  const filmes = await prisma.movie.findMany({
    where: { videoUrl: { contains: "drive.google" } },
    select: { id: true, title: true, slug: true, videoUrl: true },
    orderBy: { title: "asc" },
  });

  console.log(`${filmes.length} vídeos ainda no Drive.\n`);
  if (filmes.length === 0) return;

  // Guarda os links originais antes de mexer em qualquer coisa.
  const backup: Record<string, { title: string; videoUrl: string }> = existsSync(
    BACKUP
  )
    ? JSON.parse(readFileSync(BACKUP, "utf8"))
    : {};
  for (const f of filmes) {
    backup[f.id] = { title: f.title, videoUrl: f.videoUrl };
  }
  writeFileSync(BACKUP, JSON.stringify(backup, null, 2));
  console.log(`Links originais guardados em ${BACKUP}\n`);

  if (soListar) {
    filmes.forEach((f, i) => console.log(`${i + 1}. ${f.title.trim()}`));
    return;
  }

  const fila = filmes.slice(0, limite);
  let ok = 0;
  let falhas = 0;
  let bytesTotais = 0;
  const inicioGeral = Date.now();

  for (const [i, filme] of fila.entries()) {
    const nome = filme.title.trim();
    const fileId = idDoDrive(filme.videoUrl);
    if (!fileId) {
      console.log(`[${i + 1}/${fila.length}] ${nome} — link estranho, pulei`);
      falhas++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${fila.length}] ${nome} ... `);
    const inicio = Date.now();

    try {
      const res = await fetch(linkDireto(fileId));
      const tipo = res.headers.get("content-type") ?? "";
      const tamanho = Number(res.headers.get("content-length") ?? 0);

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      // O Drive devolve HTML quando o arquivo é privado ou quando ele acha que
      // é robô. Nesse caso não dá pra seguir: subiria uma página de erro.
      if (tipo.includes("text/html")) {
        throw new Error("Drive devolveu página (privado ou limite de acesso)");
      }

      const key = `videos/${filme.slug}.mp4`;

      const upload = new Upload({
        client: r2,
        params: {
          Bucket: BUCKET,
          Key: key,
          Body: Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]),
          ContentType: "video/mp4",
        },
        partSize: 64 * 1024 * 1024,
        queueSize: 4,
      });

      await upload.done();

      const novaUrl = `${PUBLIC_URL}/${key}`;
      await prisma.movie.update({
        where: { id: filme.id },
        data: { videoUrl: novaUrl },
      });

      const levou = Date.now() - inicio;
      bytesTotais += tamanho;
      ok++;
      console.log(
        `ok — ${gb(tamanho)} GB em ${duracao(levou)} (${(
          tamanho / 1024 ** 2 / (levou / 1000)
        ).toFixed(1)} MB/s)`
      );
    } catch (err) {
      falhas++;
      console.log(`FALHOU — ${(err as Error).message}`);
    }
  }

  const total = Date.now() - inicioGeral;
  console.log(
    `\nProntos: ${ok} | Falharam: ${falhas} | ${gb(bytesTotais)} GB em ${duracao(total)}`
  );
  if (ok > 0) {
    const mbps = bytesTotais / 1024 ** 2 / (total / 1000);
    console.log(`Média: ${mbps.toFixed(1)} MB/s`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
