import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import {
  GUEST_COOKIE,
  lerConvites,
  TESTE_GRATIS_ATIVO,
  TRIAL_COOKIE,
} from "./cookies";
import { unsignValue, verifyToken } from "./tokens";

const UM_DIA = 24 * 60 * 60 * 1000;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
    },
  });

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return user;
}

export function isSubscriptionActive(user: {
  subscriptionStatus: string;
  subscriptionExpiresAt: Date | null;
}) {
  if (user.subscriptionStatus !== "active") return false;
  if (!user.subscriptionExpiresAt) return true;
  return new Date(user.subscriptionExpiresAt) > new Date();
}

/**
 * Convite ainda vale?
 *
 * `movieId` é o filme que a pessoa está tentando abrir. Convite preso a uma
 * série só abre aquela série; convite sem série presa abre o catálogo todo.
 * Sem `movieId` a checagem é genérica (vale se o convite estiver de pé).
 */
export async function validateGuestToken(
  token: string,
  movieId?: string
): Promise<boolean> {
  // O cookie guarda VÁRIOS convites separados por vírgula: a cliente recebe um
  // link por série. Basta um deles liberar a série pedida.
  const tokens = lerConvites(token);
  if (!tokens.length) return false;

  const convites = await prisma.guestToken.findMany({
    where: { token: { in: tokens }, active: true },
  });

  const agora = new Date();
  return convites.some((c) => {
    // Sem data = link fixo de divulgação, nunca vence.
    if (c.expiresAt && new Date(c.expiresAt) <= agora) return false;
    if (c.movieId && c.movieId !== movieId) return false;
    return true;
  });
}

/**
 * Quantos dias ainda faltam do teste grátis. Devolve null se a pessoa não
 * está em teste (nunca teve, já venceu, ou o cookie foi adulterado).
 */
export async function getTrialDaysLeft(): Promise<number | null> {
  if (!TESTE_GRATIS_ATIVO) return null;

  const cookieStore = await cookies();
  const raw = unsignValue(cookieStore.get(TRIAL_COOKIE)?.value);
  if (!raw) return null;

  const fim = Number(raw);
  if (isNaN(fim)) return null;

  const restante = fim - Date.now();
  if (restante <= 0) return null;

  return Math.ceil(restante / UM_DIA);
}

/**
 * A pessoa está assistindo por um link de divulgação (e não por assinatura)?
 *
 * É isso que decide se a oferta aparece no fim da série — assinante que
 * terminou de assistir não precisa ver propaganda de assinatura.
 */
export async function veioDeConvite(movieId?: string): Promise<boolean> {
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (!guestToken) return false;
  if (!(await validateGuestToken(guestToken, movieId))) return false;

  const user = await getCurrentUser();
  if (user?.role === "admin") return false;
  if (user && isSubscriptionActive(user)) return false;
  return true;
}

/**
 * `movieId`: qual série a pessoa quer ver. Só importa pros convites presos a
 * uma série — o resto (teste, assinatura, admin) não olha pra isso.
 */
export async function hasAccess(movieId?: string): Promise<boolean> {
  const cookieStore = await cookies();

  // Teste grátis automático (quando ligado). O cookie é assinado — sem a
  // assinatura correta ele é ignorado. Com o teste desligado nem olhamos pro
  // cookie: quem estava no meio do teste perde o acesso na hora.
  if (TESTE_GRATIS_ATIVO) {
    const trialCookie = unsignValue(cookieStore.get(TRIAL_COOKIE)?.value);
    if (trialCookie) {
      const expiresAt = Number(trialCookie);
      if (!isNaN(expiresAt) && Date.now() < expiresAt) return true;
    }
  }

  // Verifica link de convidado
  const guestToken = cookieStore.get(GUEST_COOKIE)?.value;
  if (guestToken) {
    const valid = await validateGuestToken(guestToken, movieId);
    if (valid) return true;
  }

  // Verifica assinatura ativa
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  return isSubscriptionActive(user);
}
