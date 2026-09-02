import { NextRequest, NextResponse } from "next/server";
import {
  SECURE_COOKIE_DEFAULTS,
  TESTE_GRATIS_ATIVO,
  TRIAL_COOKIE,
  TRIAL_COOKIE_MAX_AGE,
} from "@/lib/cookies";
import { signValue, unsignValue, verifyToken } from "@/lib/tokens";
import { ehDaEquipe, podeAbrir } from "@/lib/equipe";

const TRIAL_DAYS = 7;
const UM_DIA = 24 * 60 * 60 * 1000;

/**
 * Portão do /admin.
 *
 * Admin abre tudo. Colaborador abre só as páginas do dia a dia — as de fora
 * mandam ele de volta pro início do painel, em vez de pro login (ele ESTÁ
 * logado, só não tem essa permissão). Quem não é da equipe vai pro login.
 */
function guardAdmin(req: NextRequest): NextResponse | null {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/admin") || pathname === "/admin/login") return null;

  const token = req.cookies.get("token")?.value;
  const payload = token ? verifyToken(token) : null;

  const url = req.nextUrl.clone();
  url.search = "";

  if (!ehDaEquipe(payload?.role)) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (!podeAbrir(pathname, payload?.role)) {
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return null;
}

export function proxy(req: NextRequest) {
  const blocked = guardAdmin(req);
  if (blocked) return blocked;

  // O link de convite cuida dos próprios cookies (prazo do convite + queima do
  // teste). Se o proxy mexesse aqui, os dois disputariam o mesmo cookie na
  // mesma resposta e o resultado dependeria da ordem.
  if (req.nextUrl.pathname.startsWith("/convite/")) {
    return NextResponse.next();
  }

  // Teste grátis desligado: ninguém ganha prazo novo. Quem já tem o cookie
  // também não assiste mais — quem ignora o cookie é o `hasAccess`.
  if (!TESTE_GRATIS_ATIVO) return NextResponse.next();

  const teto = Date.now() + TRIAL_DAYS * UM_DIA;
  const atual = unsignValue(req.cookies.get(TRIAL_COOKIE)?.value);

  if (atual) {
    const venceEm = Number(atual);
    // Cookie de quando o teste era mais longo: encurta pro prazo de hoje.
    // Já vencido a gente NÃO mexe — senão o teste renovaria pra sempre.
    if (isNaN(venceEm) || venceEm <= teto) return NextResponse.next();
  }

  // Primeira visita, cookie adulterado, ou prazo antigo maior que o atual
  const expiresAt = new Date(teto);
  const value = signValue(String(expiresAt.getTime()));

  // IMPORTANTE: setar na REQUEST também, pra que os server components dessa
  // mesma requisição enxerguem o trial (caso contrário o usuário que entra
  // direto num link de filme veria "Assinar" no primeiro load).
  req.cookies.set(TRIAL_COOKIE, value);

  const res = NextResponse.next({
    request: { headers: req.headers },
  });

  res.cookies.set(TRIAL_COOKIE, value, {
    ...SECURE_COOKIE_DEFAULTS,
    maxAge: TRIAL_COOKIE_MAX_AGE,
  });

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/).*)",
  ],
};
