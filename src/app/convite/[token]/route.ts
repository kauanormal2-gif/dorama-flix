import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  GUEST_COOKIE,
  juntarConvites,
  SECURE_COOKIE_DEFAULTS,
  TRIAL_COOKIE,
  TRIAL_COOKIE_MAX_AGE,
} from "@/lib/cookies";
import { signValue } from "@/lib/tokens";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const guest = await prisma.guestToken.findUnique({
    where: { token },
    include: { movie: { select: { slug: true, status: true } } },
  });

  // Usa o próprio endereço de onde o link foi aberto, em vez de depender de
  // NEXT_PUBLIC_APP_URL (que pode não estar setada e joga pra localhost).
  const baseUrl = req.nextUrl.origin;

  const venceu = guest?.expiresAt
    ? new Date(guest.expiresAt) <= new Date()
    : false;

  if (!guest || !guest.active || venceu) {
    return NextResponse.redirect(new URL("/link-invalido", baseUrl));
  }

  // Convite de série única cai direto na série — quem recebe o link no zap
  // quer ver aquilo, não procurar no catálogo (que nem vai abrir pra ela).
  const destino =
    guest.movie && guest.movie.status === "active"
      ? `/filme/${guest.movie.slug}`
      : "/";

  const response = NextResponse.redirect(new URL(destino, baseUrl));

  // SOMA o convite aos que ela já tinha, em vez de trocar. Trocando, abrir o
  // link da segunda série derrubava o acesso à primeira.
  //
  // O cookie sempre vale um ano: quem manda no acesso é o banco, então um
  // convite com prazo continua vencendo na data certa, e revogar o link corta
  // o acesso mesmo com o cookie no lugar.
  response.cookies.set(
    GUEST_COOKIE,
    juntarConvites(req.cookies.get(GUEST_COOKIE)?.value, token),
    { ...SECURE_COOKIE_DEFAULTS, maxAge: TRIAL_COOKIE_MAX_AGE }
  );

  // Queima o teste grátis de 7 dias. Sem isso o convidado teria o prazo do
  // convite E o teste por cima — e ganharia mais 7 dias quando o convite
  // acabasse. Marcar como já vencido faz o acesso dele valer exatamente o
  // prazo do link, e também permite revogar o convite de verdade.
  response.cookies.set(TRIAL_COOKIE, signValue(String(Date.now())), {
    ...SECURE_COOKIE_DEFAULTS,
    maxAge: TRIAL_COOKIE_MAX_AGE,
  });

  return response;
}
