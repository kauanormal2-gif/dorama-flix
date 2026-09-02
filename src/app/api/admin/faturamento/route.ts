import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

const DIA = 86400000;

/** Início do dia (00:00) — pra "hoje" não começar 24h atrás. */
function inicioDoDia(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * Faturamento do checkout do site (Efí).
 *
 * IMPORTANTE: venda feita fora do site (Cakto) não passa por aqui — o site só
 * sabe do que ele mesmo cobrou. Por isso a tela avisa isso na cara.
 */
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const agora = new Date();
  const hoje = inicioDoDia(agora);

  const pagos = await prisma.payment.findMany({
    where: { status: "paid" },
    select: { amount: true, plan: true, method: true, paidAt: true, createdAt: true },
  });

  // paidAt é o que vale; se faltar, cai pro createdAt pra não sumir da conta.
  const comData = pagos.map((p) => ({
    ...p,
    quando: p.paidAt ?? p.createdAt,
  }));

  const somaDesde = (inicio: Date, fim?: Date) =>
    comData
      .filter((p) => p.quando >= inicio && (!fim || p.quando < fim))
      .reduce((t, p) => t + p.amount, 0);

  const contaDesde = (inicio: Date, fim?: Date) =>
    comData.filter((p) => p.quando >= inicio && (!fim || p.quando < fim)).length;

  const d7 = new Date(agora.getTime() - 7 * DIA);
  const d14 = new Date(agora.getTime() - 14 * DIA);
  const d30 = new Date(agora.getTime() - 30 * DIA);
  const d60 = new Date(agora.getTime() - 60 * DIA);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);

  const periodos = {
    hoje: { valor: somaDesde(hoje), vendas: contaDesde(hoje) },
    dias7: {
      valor: somaDesde(d7),
      vendas: contaDesde(d7),
      anterior: somaDesde(d14, d7),
    },
    dias30: {
      valor: somaDesde(d30),
      vendas: contaDesde(d30),
      anterior: somaDesde(d60, d30),
    },
    mes: {
      valor: somaDesde(inicioMes),
      vendas: contaDesde(inicioMes),
      anterior: somaDesde(inicioMesPassado, inicioMes),
    },
    total: { valor: somaDesde(new Date(0)), vendas: comData.length },
  };

  // Últimos 30 dias, um ponto por dia — é o gráfico da tela.
  const porDia: { dia: string; valor: number; vendas: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const ini = inicioDoDia(new Date(agora.getTime() - i * DIA));
    const fim = new Date(ini.getTime() + DIA);
    porDia.push({
      dia: ini.toISOString().slice(0, 10),
      valor: somaDesde(ini, fim),
      vendas: contaDesde(ini, fim),
    });
  }

  const agrupar = (campo: "method" | "plan") => {
    const m = new Map<string, { valor: number; vendas: number }>();
    for (const p of comData) {
      const k = p[campo];
      const at = m.get(k) ?? { valor: 0, vendas: 0 };
      at.valor += p.amount;
      at.vendas++;
      m.set(k, at);
    }
    return [...m.entries()]
      .map(([nome, v]) => ({ nome, ...v }))
      .sort((a, b) => b.valor - a.valor);
  };

  // Dinheiro que ficou no caminho: cobrança gerada e não paga nos últimos 30d.
  const pendentes = await prisma.payment.aggregate({
    where: { status: "pending", createdAt: { gte: d30 } },
    _count: true,
    _sum: { amount: true },
  });

  const [ativas, vencendo, porPlataforma] = await Promise.all([
    prisma.user.count({
      where: {
        subscriptionStatus: "active",
        role: "user",
        OR: [
          { subscriptionExpiresAt: null },
          { subscriptionExpiresAt: { gt: agora } },
        ],
      },
    }),
    prisma.user.count({
      where: {
        subscriptionStatus: "active",
        role: "user",
        subscriptionExpiresAt: {
          gt: agora,
          lte: new Date(agora.getTime() + 7 * DIA),
        },
      },
    }),
    prisma.user.groupBy({
      by: ["subscriptionPlatform"],
      _count: true,
      where: {
        subscriptionStatus: "active",
        role: "user",
        OR: [
          { subscriptionExpiresAt: null },
          { subscriptionExpiresAt: { gt: agora } },
        ],
      },
    }),
  ]);

  return NextResponse.json({
    periodos,
    porDia,
    porMetodo: agrupar("method"),
    porPlano: agrupar("plan"),
    pendentes: { vendas: pendentes._count, valor: pendentes._sum.amount ?? 0 },
    assinantes: {
      ativas,
      vencendo7dias: vencendo,
      porPlataforma: porPlataforma
        .map((p) => ({ nome: p.subscriptionPlatform ?? "sem origem", total: p._count }))
        .sort((a, b) => b.total - a.total),
    },
  });
}
