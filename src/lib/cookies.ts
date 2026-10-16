import { signValue, unsignValue } from "./tokens";

/**
 * Configuração central de cookies — todos os cookies do app devem usar
 * esses defaults pra garantir consistência de segurança.
 *
 * - httpOnly: bloqueia acesso via JavaScript (defesa contra XSS)
 * - secure: só transmite via HTTPS (em prod)
 * - sameSite lax: permite navegação normal mas bloqueia CSRF cross-site
 */
export const SECURE_COOKIE_DEFAULTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const TRIAL_COOKIE = "trial_started";

/**
 * Liga/desliga o teste grátis automático de 7 dias.
 *
 * Desligado em 28/08/2026 a pedido da dona: quem quiser assistir tem que
 * assinar. Desligar aqui faz duas coisas de uma vez — o proxy para de dar teste
 * pra visitante nova, e o cookie de quem já estava em teste deixa de valer
 * (senão a virada demoraria mais 7 dias pra acontecer de verdade).
 *
 * Pra voltar atrás é só trocar pra `true` — o resto do código já está pronto.
 * Convite de link (`guest_token`) NÃO depende disso e continua funcionando.
 */
export const TESTE_GRATIS_ATIVO = false;

/**
 * O cookie do teste grátis precisa VIVER MUITO MAIS que o próprio teste.
 * Ele guarda a data de fim dentro do valor; se o navegador apagasse o cookie
 * junto com o fim do teste, o visitante voltaria a ser "novo" e ganharia
 * outro teste, pra sempre.
 */
export const TRIAL_COOKIE_MAX_AGE = 365 * 24 * 60 * 60;

/** Nome do cookie que guarda os convites que a pessoa já abriu. */
export const GUEST_COOKIE = "guest_token";

/**
 * Quantos convites cabem no cookie.
 *
 * A cliente costuma receber vários links de série diferentes. Guardando só o
 * último, abrir o segundo link matava o acesso ao primeiro — que era
 * exatamente o que estava acontecendo. 20 dá folga de sobra e o cookie fica
 * em ~700 bytes, longe do limite de 4 KB do navegador.
 */
export const MAX_CONVITES = 20;

/**
 * Um convite guardado no navegador da pessoa.
 *
 * `fim` só existe nos links de prazo rolante (o mesmo link vale pra todo
 * mundo e cada um ganha os dias a partir da SUA abertura). Nos links antigos
 * o prazo é a data fixa que está no banco, e aqui vem vazio.
 */
export interface ConviteGuardado {
  token: string;
  fim?: number;
}

/**
 * Lê os convites do cookie.
 *
 * O valor é assinado pra ninguém esticar o próprio prazo editando o cookie.
 * Formato antigo (lista crua, sem assinatura) continua sendo aceito — senão
 * quem já tinha convite perderia o acesso na hora que isto subisse.
 */
export function lerConvites(valor: string | undefined): ConviteGuardado[] {
  if (!valor) return [];

  const cru = unsignValue(valor) ?? valor;

  return cru
    .replace(/%2C/gi, ",")
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean)
    .map((parte) => {
      const [token, fim] = parte.split("~");
      const prazo = Number(fim);
      return token && !isNaN(prazo) && prazo > 0
        ? { token, fim: prazo }
        : { token };
    })
    .filter((c) => c.token)
    .slice(0, MAX_CONVITES);
}

/**
 * Junta o convite novo aos que já existiam, sem repetir. O novo vem primeiro.
 *
 * `fimEmMs` é o instante em que o acesso DESTA pessoa acaba (links de prazo
 * rolante). Sem ele, quem manda no prazo é a data do banco.
 */
export function juntarConvites(
  atual: string | undefined,
  novo: string,
  fimEmMs?: number
) {
  const entrada = fimEmMs ? `${novo}~${fimEmMs}` : novo;
  const resto = lerConvites(atual)
    .filter((c) => c.token !== novo)
    .map((c) => (c.fim ? `${c.token}~${c.fim}` : c.token));

  return signValue([entrada, ...resto].slice(0, MAX_CONVITES).join(","));
}
