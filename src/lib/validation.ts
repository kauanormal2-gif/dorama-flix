/**
 * Validação básica de email (formato) — não valida existência.
 */
export function isValidEmail(email: string): boolean {
  if (typeof email !== "string") return false;
  if (email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validação de força de senha.
 * Regras: mín 8 chars, ao menos 1 letra e 1 número.
 */
export function validatePassword(password: string): {
  ok: boolean;
  error?: string;
} {
  if (typeof password !== "string") {
    return { ok: false, error: "Senha inválida" };
  }
  if (password.length < 8) {
    return { ok: false, error: "Senha deve ter no mínimo 8 caracteres" };
  }
  if (password.length > 128) {
    return { ok: false, error: "Senha muito longa" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { ok: false, error: "Senha deve conter ao menos uma letra" };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "Senha deve conter ao menos um número" };
  }
  return { ok: true };
}

export function sanitizeName(name: string): string {
  return name.trim().slice(0, 100);
}
