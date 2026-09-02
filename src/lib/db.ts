import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

/**
 * Conexão com o banco (Neon).
 *
 * Usa o driver serverless da Neon em vez do `pg` comum: o `pg` abre uma
 * conexão TCP crua, coisa que a Cloudflare não deixa fazer — o pacote
 * `pg-cloudflare` que serviria de ponte vem só com arquivos vazios e quebra o
 * empacotamento. O driver da Neon fala por WebSocket/HTTP e roda nos dois
 * lugares: aqui no computador e na hospedagem.
 */
function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
