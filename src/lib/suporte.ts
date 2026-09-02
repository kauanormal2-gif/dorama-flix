/** WhatsApp do atendimento, em um lugar só (rodapé e Perfil usam daqui). */
export const SUPORTE_WHATSAPP = "5531973557274";
export const SUPORTE_WHATSAPP_VISIVEL = "(31) 97355-7274";

/**
 * Monta o link do WhatsApp já com a mensagem escrita.
 *
 * Quando a pessoa está logada, a mensagem começa com o nome dela — assim dá
 * pra saber de quem é o pedido sem precisar perguntar.
 */
export function linkSuporte(nome?: string | null) {
  const texto = nome?.trim()
    ? `Oi, aqui é ${nome.trim()}. Preciso de ajuda com o Drama Flix.`
    : "Oi! Preciso de ajuda com o Drama Flix.";
  return `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}

/**
 * Link pra quem travou na hora de pagar.
 *
 * A mensagem já vai com nome, e-mail e plano da tentativa — sem isso o
 * atendimento vira um vai-e-vem de perguntas antes de resolver qualquer coisa.
 */
export function linkProblemaPagamento(dados: {
  nome?: string;
  email?: string;
  plano?: string;
}) {
  const partes = [
    dados.nome?.trim() ? `Oi, aqui é ${dados.nome.trim()}.` : "Oi!",
    "Estou tentando assinar o Drama Flix e não estou conseguindo pagar.",
  ];
  if (dados.plano) partes.push(`Plano: ${dados.plano}.`);
  if (dados.email?.trim()) partes.push(`Meu e-mail: ${dados.email.trim()}.`);
  return `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(partes.join(" "))}`;
}

/**
 * Link pra quem acabou de assistir uma série pelo convite e quer o app.
 *
 * A mensagem diz de qual série ela veio — é o melhor gancho pra conversa e
 * mostra qual divulgação está trazendo cliente.
 */
export function linkQueroAssinar(serie?: string) {
  const texto = serie?.trim()
    ? `Oi! Terminei de assistir "${serie.trim()}" e quero assinar o Drama Flix.`
    : "Oi! Quero assinar o Drama Flix.";
  return `https://wa.me/${SUPORTE_WHATSAPP}?text=${encodeURIComponent(texto)}`;
}
