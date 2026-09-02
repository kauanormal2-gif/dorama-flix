// Preenche os gêneros de cada filme a partir do título + descrição e cria os
// gêneros novos (Doramas / Novelas Turcas).
//
//   node classify-genres.js            -> só mostra o que faria
//   node classify-genres.js --apply    -> grava no banco
//
// Nunca remove categoria existente, só adiciona o que está faltando.

require("dotenv").config({ path: ".env" });
const { Client } = require("pg");

const APPLY = process.argv.includes("--apply");
const clean = (v) => (v || "").replace(/^["']|["']$/g, "");

const norm = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

// Gêneros que precisam existir (nome -> slug)
const NEW_CATEGORIES = [
  { name: "Doramas", slug: "doramas" },
  { name: "Novelas Turcas", slug: "novelas-turcas" },
];

// Regras por palavra-chave, aplicadas em título + descrição.
const RULES = [
  ["ceo-bilionario", /bilionari|\bceo\b|chefao|magnata|milionari|imperio milionario|dona de um imperio/],
  ["vinganca", /vinganc|vingar|se vinga|vingativ|acertar contas|acerto de contas/],
  ["fantasia", /dragao|\balfa\b|imortal|magia|magic|profecia|feitic|sobrenatural|rei leopardo|deuses|cultiv|poder extraordinari|criaturas lendarias/],
  ["acao", /mafia|mafios|artes marciais|atirador|sniper|fuzileiro|policia|policiais|\blapd\b|missao perigosa|batalh|tiros|sequestrad|guerreir|combate/],
  ["familia", /\bbebe\b|bebes|gravid|engravid|mamae|papai|quadrigemeos|gemeos|crianca|filha|filho|filhos|mae solo|pai solteiro/],
  ["misterio", /misterio|misterios|misterioso|misteriosa|identidade secreta|vida dupla|vida secreta|farsa/],
  ["comedia", /comedia|comica|caotic|confusao|situacoes inesperadas e engracadas|romantica cheia/],
  ["esporte", /hoquei|drift|corrida|quarterback|atleta|campeao|futebol|no gelo|pistas/],
  ["suspense", /perigo|ameac|assassinat|crime|traic|chantag|conspira/],
  ["romance", /romance|romantic|paix|apaixon|amor|casament|casad|noiv|namor|sedu/],
  ["drama", /drama|superac|sofr|humilha|injustic|luta para|dificuldades|segredo/],
];

// Doramas: identificados pelo estilo asiático (xianxia/cultivo, artes marciais,
// jovem mestre, imortal, rei dragão). Feito na mão porque keyword sozinha erra.
const DORAMAS = [
  "do simplorio ao sigma",
  "do exilio a dominacao",
  "fraco falso, poder verdadeiro",
  "marido em casa? melhor supremo imortal",
  "mamae pai e dragao supremo",
  "o acougueiro, senhor das artes marciais",
  "o novato mais forte do mundo",
  "retorno do jovem metre",
  "um so golpe: modo deus",
  "voltou do inferno pro vinganca",
  "minha irma e a rainha guerreira",
  "me rejeite rei dragao",
  "a noiva virgem do rei dragao",
  "espera... o pai e o rei leopardo",
];

(async () => {
  const db = new Client({ connectionString: clean(process.env.DATABASE_URL) });
  await db.connect();

  // 1. Garante que os gêneros novos existem
  for (const c of NEW_CATEGORIES) {
    const found = await db.query(`select id from "Category" where slug = $1`, [c.slug]);
    if (found.rows.length) {
      console.log(`categoria "${c.name}" já existe`);
      continue;
    }
    console.log(`${APPLY ? "criando" : "criaria"} categoria "${c.name}"`);
    if (APPLY) {
      await db.query(
        `insert into "Category" (id, name, slug) values (gen_random_uuid()::text, $1, $2)`,
        [c.name, c.slug]
      );
    }
  }

  const catRows = (await db.query(`select id, name, slug from "Category"`)).rows;
  const catBySlug = Object.fromEntries(catRows.map((c) => [c.slug, c]));

  // 2. Classifica cada filme
  const movies = (
    await db.query(
      `select m.id, m.title, coalesce(m.description,'') as description,
              coalesce(array_agg(c.slug) filter (where c.slug is not null), '{}') as slugs
       from "Movie" m
       left join "MovieCategory" mc on mc."movieId" = m.id
       left join "Category" c on c.id = mc."categoryId"
       group by m.id, m.title, m.description
       order by m.title`
    )
  ).rows;

  let added = 0;
  const report = [];

  for (const m of movies) {
    const hay = norm(`${m.title} ${m.description}`);
    const wanted = new Set();

    for (const [slug, re] of RULES) if (re.test(hay)) wanted.add(slug);
    if (DORAMAS.some((d) => norm(m.title).includes(d))) wanted.add("doramas");

    // Todo filme precisa de pelo menos Drama pra não ficar órfão no catálogo
    if (!wanted.size && !m.slugs.length) wanted.add("drama");

    const missing = [...wanted].filter(
      (s) => !m.slugs.includes(s) && catBySlug[s]
    );
    if (!missing.length) continue;

    report.push(`${m.title.trim().slice(0, 45)}  +${missing.join(", ")}`);
    added += missing.length;

    if (APPLY) {
      for (const slug of missing) {
        await db.query(
          `insert into "MovieCategory" ("movieId", "categoryId")
           values ($1, $2)
           on conflict do nothing`,
          [m.id, catBySlug[slug].id]
        );
      }
    }
  }

  console.log(`\n${report.length} filmes recebem categoria nova (${added} vínculos)\n`);
  console.log(report.join("\n"));
  console.log(APPLY ? "\n>>> GRAVADO" : "\n>>> DRY RUN (rode com --apply pra valer)");

  await db.end();
})().catch((e) => {
  console.error("ERRO:", e.message);
  process.exit(1);
});
