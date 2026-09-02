import { getCurrentUser } from "./auth";
import { ehDaEquipe } from "./equipe";

/**
 * Portão das rotas que a equipe usa: deixa passar admin e colaborador.
 *
 * Fica separado de `equipe.ts` porque aquele arquivo também roda no navegador
 * e não pode arrastar banco de dados pro pacote do cliente.
 */
export async function requireEquipe() {
  const user = await getCurrentUser();
  if (!user || !ehDaEquipe(user.role)) {
    throw new Error("Unauthorized");
  }
  return user;
}
