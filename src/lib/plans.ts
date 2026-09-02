export type PlanKey = "mensal" | "trimestral" | "anual";

export interface Plan {
  key: PlanKey;
  name: string;
  /** Valor em centavos — fonte da verdade, nunca confiar no cliente */
  amount: number;
  /** Dias de acesso liberados após o pagamento */
  days: number;
  period: string;
  duration: string;
  features: string[];
  highlight?: boolean;
  ribbon?: string;
}

export const PLANS: Record<PlanKey, Plan> = {
  mensal: {
    key: "mensal",
    name: "Mensal",
    amount: 990,
    days: 30,
    period: "/mês",
    duration: "30 dias",
    features: ["Acesso ilimitado", "1 mês de acesso", "Qualidade HD", "Suporte"],
  },
  trimestral: {
    key: "trimestral",
    name: "Trimestral",
    amount: 2000,
    days: 90,
    period: "/trimestre",
    duration: "90 dias",
    highlight: true,
    ribbon: "Mais Popular",
    features: [
      "Acesso ilimitado",
      "3 meses de acesso",
      "Qualidade Full HD",
      "+3 telas",
      "Suporte prioritário",
    ],
  },
  anual: {
    key: "anual",
    name: "Anual",
    amount: 4500,
    days: 365,
    period: "/ano",
    duration: "12 meses",
    features: [
      "Acesso ilimitado",
      "12 meses de acesso",
      "Qualidade 4K",
      "+5 telas",
      "Suporte VIP",
    ],
  },
};

export const PLAN_LIST = Object.values(PLANS);

export function getPlan(key: unknown): Plan | null {
  if (typeof key !== "string") return null;
  return PLANS[key as PlanKey] ?? null;
}

/** "990" -> "9,90" */
export function formatBRL(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** "990" -> "9.90" (formato exigido pela API Pix) */
export function toPixValue(cents: number): string {
  return (cents / 100).toFixed(2);
}
