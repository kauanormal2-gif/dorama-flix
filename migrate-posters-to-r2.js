// Migra os pôsteres que ainda estão no Vercel Blob para o Cloudflare R2
// e repontа as URLs no banco. R2 tem egress grátis (Blob cobra ~US$29/mês).
//
// Uso:
//   node migrate-posters-to-r2.js            -> só mostra o que faria (dry run)
//   node migrate-posters-to-r2.js --apply    -> migra de verdade

const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.prod.tmp" });
// As CLOUDFLARE_* vieram VAZIAS da Vercel — .env.r2 tem os valores reais.
require("dotenv").config({ path: ".env.r2", override: true });
const { Client } = require("pg");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const APPLY = process.argv.includes("--apply");
const CONCURRENCY = 5;

const clean = (v) => (v || "").replace(/^["']|["']$/g, "");

const DATABASE_URL = clean(process.env.DATABASE_URL);
const ACCOUNT_ID = clean(process.env.CLOUDFLARE_ACCOUNT_ID);
const ACCESS_KEY = clean(process.env.CLOUDFLARE_R2_ACCESS_KEY_ID);
const SECRET_KEY = clean(process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY);
const BUCKET = clean(process.env.CLOUDFLARE_R2_BUCKET);
const PUBLIC_URL = clean(process.env.CLOUDFLARE_R2_PUBLIC_URL).replace(/\/$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
});

const MIME = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function migrateOne(movie) {
  const oldUrl = movie.thumbnail;
  const fileName = decodeURIComponent(new URL(oldUrl).pathname.split("/").pop());
  const ext = path.extname(fileName).toLowerCase();
  const key = `images/${fileName}`;
  const newUrl = `${PUBLIC_URL}/${key}`;

  if (!APPLY) return { ...movie, key, newUrl, action: "dry-run" };

  if (!(await existsInR2(key))) {
    const res = await fetch(oldUrl);
    if (!res.ok) throw new Error(`download falhou (${res.status})`);
    const buf = Buffer.from(await res.arrayBuffer());
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buf,
        ContentType: MIME[ext] || res.headers.get("content-type") || "application/octet-stream",
      })
    );
  }

  // Confere que ficou público antes de trocar no banco
  const check = await fetch(newUrl, { method: "HEAD" });
  if (!check.ok) throw new Error(`R2 não serve a imagem (${check.status})`);

  return { ...movie, key, newUrl, action: "migrated" };
}

(async () => {
  const db = new Client({ connectionString: DATABASE_URL });
  await db.connect();

  const { rows } = await db.query(
    `select id, title, thumbnail from "Movie"
     where thumbnail like '%vercel-storage.com%' order by title`
  );

  console.log(`${rows.length} pôsteres no Vercel Blob`);
  console.log(APPLY ? ">>> MODO APPLY (vai migrar de verdade)\n" : ">>> DRY RUN (nada será alterado)\n");

  if (!rows.length) {
    await db.end();
    return;
  }

  // Backup das URLs atuais antes de qualquer alteração
  if (APPLY) {
    const backupPath = `backup-thumbnails-${Date.now()}.json`;
    fs.writeFileSync(backupPath, JSON.stringify(rows, null, 2));
    console.log(`Backup salvo em ${backupPath}\n`);
  }

  const done = [];
  const failed = [];
  const queue = [...rows];

  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length) {
        const movie = queue.shift();
        try {
          const r = await migrateOne(movie);
          if (APPLY) {
            await db.query(`update "Movie" set thumbnail = $1 where id = $2`, [r.newUrl, r.id]);
          }
          done.push(r);
          console.log(`ok   ${done.length + failed.length}/${rows.length}  ${movie.title.slice(0, 45)}`);
        } catch (e) {
          failed.push({ ...movie, error: e.message });
          console.log(`FALHA  ${movie.title.slice(0, 45)} -> ${e.message}`);
        }
      }
    })
  );

  const left = await db.query(
    `select count(*)::int n from "Movie" where thumbnail like '%vercel-storage.com%'`
  );

  console.log(`\nmigrados: ${done.length}   falhas: ${failed.length}`);
  console.log(`ainda no Blob: ${left.rows[0].n}`);
  if (failed.length) console.log("\nfalhas:", failed.map((f) => `${f.title}: ${f.error}`).join("\n"));

  await db.end();
})().catch((e) => {
  console.error("ERRO FATAL:", e.message);
  process.exit(1);
});
