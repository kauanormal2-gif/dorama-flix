#!/usr/bin/env node
/**
 * Cadastra (ou consulta) o webhook do Pix na Efí.
 *
 *   node scripts/efi-webhook.js                     # mostra o webhook atual
 *   node scripts/efi-webhook.js https://seu.site    # cadastra
 *
 * A Efí acrescenta "/pix" na URL, então cadastre a base:
 *   https://dramaflixbr.com.br/api/webhooks/efi
 */
const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");

// Carrega .env.local / .env sem depender de pacote
for (const file of [".env.local", ".env"]) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) continue;
  for (const line of fs.readFileSync(full, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}

const SANDBOX = process.env.EFI_ENV !== "production";
const HOST = SANDBOX ? "pix-h.api.efipay.com.br" : "pix.api.efipay.com.br";
const PEM = Buffer.from(process.env.EFI_CERT_PEM, "base64").toString("utf8");

function request(method, urlPath, headers, body) {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: HOST,
        port: 443,
        path: urlPath,
        method,
        cert: PEM,
        key: PEM,
        minVersion: "TLSv1.2",
        headers: {
          "Content-Type": "application/json",
          ...headers,
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => (raw += c));
        res.on("end", () => resolve({ status: res.statusCode, body: raw }));
      }
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  const basic = Buffer.from(
    `${process.env.EFI_PIX_CLIENT_ID}:${process.env.EFI_PIX_CLIENT_SECRET}`
  ).toString("base64");

  const auth = await request(
    "POST",
    "/oauth/token",
    { Authorization: `Basic ${basic}` },
    { grant_type: "client_credentials" }
  );
  if (auth.status !== 200) {
    console.error("Falha na autenticação:", auth.status, auth.body);
    process.exit(1);
  }
  const token = JSON.parse(auth.body).access_token;
  const key = encodeURIComponent(process.env.EFI_PIX_KEY);
  const url = process.argv[2];

  if (!url) {
    const res = await request("GET", `/v2/webhook/${key}`, {
      Authorization: `Bearer ${token}`,
    });
    console.log("Ambiente:", SANDBOX ? "homologação" : "produção");
    console.log("Webhook atual:", res.status, res.body);
    return;
  }

  const webhookUrl = url.replace(/\/$/, "");
  const res = await request(
    "PUT",
    `/v2/webhook/${key}`,
    {
      Authorization: `Bearer ${token}`,
      // A Vercel não valida certificado de cliente; a segurança vem da
      // reconsulta do txid na Efí antes de liberar acesso.
      "x-skip-mtls-checking": "true",
    },
    { webhookUrl }
  );

  console.log("Cadastro:", res.status, res.body || "(sem corpo)");
  console.log("Notificações chegarão em:", `${webhookUrl}/pix`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
