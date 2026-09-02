import jwt from "jsonwebtoken";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Módulo sem dependência de banco — pode ser importado pelo proxy.ts,
 * que roda antes de qualquer conexão com o Postgres.
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // Em produção: falha alto. Em dev: alerta e usa fallback só pra não travar dev local.
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "JWT_SECRET não configurado ou muito curto (mín 32 chars). Configure na Vercel."
      );
    }
    // eslint-disable-next-line no-console
    console.warn(
      "[auth] JWT_SECRET ausente ou fraco — usando fallback de DEV. NÃO usar em prod."
    );
    return "dev-only-fallback-secret-do-not-use-in-production-please-set-jwt-secret";
  }
  return secret;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/** `expiresIn` no formato do jsonwebtoken ("7d", "365d"...). Padrão: 7 dias. */
export function signToken(payload: JWTPayload, expiresIn: string = "7d") {
  return jwt.sign(payload, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: expiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Assina um valor de cookie com HMAC pra impedir que o visitante edite o
 * conteúdo no navegador (ex.: esticar a data do teste grátis).
 */
export function signValue(value: string): string {
  const mac = createHmac("sha256", getJwtSecret()).update(value).digest("base64url");
  return `${value}.${mac}`;
}

/** Devolve o valor original, ou null se a assinatura não bater. */
export function unsignValue(signed: string | undefined): string | null {
  if (!signed) return null;
  const dot = signed.lastIndexOf(".");
  if (dot <= 0) return null;

  const value = signed.slice(0, dot);
  const received = Buffer.from(signed.slice(dot + 1));
  const expected = Buffer.from(
    createHmac("sha256", getJwtSecret()).update(value).digest("base64url")
  );

  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;
  return value;
}
