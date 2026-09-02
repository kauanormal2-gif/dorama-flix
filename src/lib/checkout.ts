import { getPlan, type Plan } from "./plans";
import { isValidEmail, sanitizeName } from "./validation";

export interface Customer {
  name: string;
  email: string;
  phone: string;
}

export interface CheckoutInput {
  plan: Plan;
  customer: Customer;
}

const onlyDigits = (v: unknown) => (typeof v === "string" ? v.replace(/\D/g, "") : "");

/** Valida CPF pelos dígitos verificadores. */
export function isValidCpf(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  for (const [length, position] of [
    [9, 10],
    [10, 11],
  ]) {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (position - i);
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== Number(cpf[length])) return false;
  }
  return true;
}

/**
 * Valida o corpo do checkout. O preço SEMPRE vem do servidor (PLANS),
 * o cliente só escolhe a chave do plano.
 */
export function parseCheckout(
  body: Record<string, unknown>
): { ok: true; data: CheckoutInput } | { ok: false; error: string } {
  const plan = getPlan(body.plan);
  if (!plan) return { ok: false, error: "Plano inválido" };

  const name = sanitizeName(typeof body.name === "string" ? body.name : "");
  if (name.length < 3) return { ok: false, error: "Informe seu nome completo" };

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) return { ok: false, error: "E-mail inválido" };

  const phone = onlyDigits(body.phone);
  if (phone.length < 10 || phone.length > 11) {
    return { ok: false, error: "Telefone inválido (com DDD)" };
  }

  return { ok: true, data: { plan, customer: { name, email, phone } } };
}

/**
 * CPF só é pedido em cartão e boleto, onde a Efí exige o documento do titular.
 * No Pix ele é opcional e não é coletado.
 */
export function parseCpf(
  body: Record<string, unknown>
): { ok: true; cpf: string } | { ok: false; error: string } {
  const cpf = onlyDigits(body.cpf);
  if (!isValidCpf(cpf)) return { ok: false, error: "CPF inválido" };
  return { ok: true, cpf };
}

export function appOrigin(req: Request): string {
  return new URL(req.url).origin;
}
