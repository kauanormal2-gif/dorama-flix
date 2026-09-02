/**
 * Importa os assinantes recorrentes da Lowfy pro banco do app.
 *
 *   node importar-assinantes.js            -> dry run (nao escreve nada)
 *   node importar-assinantes.js --apply    -> grava de verdade
 *
 * Regras:
 *  - nao sobrescreve conta que ja existe (so mostra e pula)
 *  - senha entra vazia: quem cuida do acesso e o login por email
 *  - vencimento = ultimo pagamento + 30 dias (plano mensal confirmado
 *    pelos ciclos de 29/30 dias dos proprios clientes)
 */
require("dotenv").config({ path: ".env" });
const fs = require("fs");
const { Client } = require("pg");

const APPLY = process.argv.includes("--apply");
const CSV = "/Users/kauaender/Downloads/orders_report.csv";

// os 6 que estao em recorrencia de verdade
const EMAILS = [
  "soraiagccardoso@hotmail.com",
  "elisetenergesmiranda@gmail.com",
  "lilitymorgana1@gmail.com",
  "thaisecmsantos1234@gmail.com",
  "psraquel394@gmail.com",
  "ganivalmarialucia@gmail.com",
];

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const clean = (v) => (v || "").replace(/^["']|["']$/g, "");

(async () => {
  const rows = parseCSV(fs.readFileSync(CSV, "utf8")).filter((r) => r.length > 5);
  const head = rows[0];
  const at = (r, name) => (r[head.indexOf(name)] || "").trim();

  // pega o pagamento mais recente de cada um dos 6
  const melhor = {};
  for (const r of rows.slice(1)) {
    const email = at(r, "Email do Cliente").toLowerCase();
    if (!EMAILS.includes(email)) continue;
    const pago = new Date(at(r, "Data de Pagamento"));
    if (!melhor[email] || pago > melhor[email].pago) {
      melhor[email] = { email, pago, nome: at(r, "Nome do Cliente") };
    }
  }

  const db = new Client({ connectionString: clean(process.env.DATABASE_URL) });
  await db.connect();

  console.log(APPLY ? "=== APLICANDO ===" : "=== DRY RUN (nada foi gravado) ===");
  console.log("");

  let criar = 0, pular = 0;
  for (const email of EMAILS) {
    const d = melhor[email];
    if (!d) { console.log("!! nao achei no CSV:", email); continue; }

    const vence = new Date(d.pago);
    vence.setDate(vence.getDate() + 30);
    const diasRestantes = Math.ceil((vence - new Date()) / 86400000);

    const ja = await db.query('select id from "User" where lower(email) = $1', [email]);
    if (ja.rows.length) {
      console.log("= ja existe, pulando:", email);
      pular++;
      continue;
    }

    console.log(
      "+ %s\n    %s | pagou %s | vence %s (%s dias)",
      d.nome,
      email,
      d.pago.toISOString().slice(0, 10),
      vence.toISOString().slice(0, 10),
      diasRestantes
    );
    criar++;

    if (APPLY) {
      await db.query(
        `insert into "User"
           (id, name, email, password, role,
            "subscriptionStatus", "subscriptionPlatform", "subscriptionExpiresAt",
            "createdAt", "updatedAt")
         values
           (gen_random_uuid()::text, $1, $2, '', 'user',
            'active', 'lowfy', $3, now(), now())`,
        [d.nome, email, vence]
      );
    }
  }

  console.log("");
  console.log("criar: %d | ja existiam: %d", criar, pular);
  if (!APPLY) console.log("\nrode com --apply pra gravar");

  await db.end();
})();
