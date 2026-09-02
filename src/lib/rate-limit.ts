import { prisma } from "./db";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Rate limit por chave (ex: "login:<ip>"). Guarda contagem numa tabela
 * Postgres com janela deslizante. Funciona em serverless (não usa memória).
 *
 * @param key chave única do bucket
 * @param max requisições permitidas na janela
 * @param windowMs duração da janela em milissegundos
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    // Upsert atomicamente — se resetAt passou, zera o count
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.resetAt < now) {
      const resetAt = new Date(now.getTime() + windowMs);
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { allowed: true, remaining: max - 1, resetAt };
    }

    if (existing.count >= max) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return {
      allowed: true,
      remaining: Math.max(0, max - updated.count),
      resetAt: updated.resetAt,
    };
  } catch {
    // Se o rate limit falhar (DB fora), fail-open pra não bloquear login legítimo
    return { allowed: true, remaining: max, resetAt: now };
  }
}

/**
 * Extrai o IP real do cliente considerando proxies (Vercel, Cloudflare).
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
