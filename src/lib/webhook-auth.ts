import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";

function equals(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Confere o segredo do webhook. Falha fechado: sem a variável configurada,
 * ninguém entra — antes, a ausência dela liberava geral.
 * O cabeçalho é o caminho preferido; a query fica só por compatibilidade com
 * plataformas que só aceitam URL (e aparece nos logs, então é o pior caso).
 */
export function checkWebhookSecret(req: NextRequest, envVar: string): boolean {
  const expected = process.env[envVar];
  const received =
    req.headers.get("x-webhook-secret") ??
    req.nextUrl.searchParams.get("secret");

  if (typeof received === "string" && expected && equals(received, expected)) {
    return true;
  }

  // TEMPORÁRIO: janela pedida pela dona do site enquanto ela troca as URLs
  // na Lowfy e na Cakto. Enquanto ligado, QUALQUER UM pode ativar assinatura.
  // Pra fechar: apagar a env WEBHOOK_ALLOW_UNSIGNED na Vercel e redeployar.
  if (process.env.WEBHOOK_ALLOW_UNSIGNED === "true") {
    console.warn(
      `[webhook] ${envVar}: aceito SEM segredo (WEBHOOK_ALLOW_UNSIGNED ligado)`
    );
    return true;
  }

  return false;
}
