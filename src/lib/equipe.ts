/**
 * Regras de quem é da equipe.
 *
 * Este arquivo é lido TAMBÉM pelo navegador (o menu do painel usa `podeAbrir`),
 * então aqui não pode entrar nada de servidor — nem banco, nem `next/headers`.
 * O portão das rotas mora em `equipe-server.ts`.
 */
/**
 * Quem entra no painel.
 *
 * - `admin`      : a dona. Vê e mexe em tudo, inclusive dinheiro.
 * - `colaborador`: quem ajuda no dia a dia. Libera acesso de cliente, pega
 *                  link de série e consulta cadastro — mas não vê faturamento
 *                  nem apaga nada.
 * - `user`       : cliente. Não entra no painel.
 */
export const PAPEIS_DO_PAINEL = ["admin", "colaborador"] as const;
export type PapelPainel = (typeof PAPEIS_DO_PAINEL)[number];

export function ehDaEquipe(papel: string | undefined | null) {
  return papel === "admin" || papel === "colaborador";
}

/**
 * Páginas do painel e quem pode abrir cada uma.
 *
 * Fica numa lista só porque o menu lateral e o portão de entrada precisam
 * concordar — se ficassem em dois lugares, um dia iam se contradizer e o
 * colaborador veria um item que não consegue abrir.
 */
export const PAGINAS_DO_PAINEL: { href: string; soAdmin: boolean }[] = [
  { href: "/admin", soAdmin: false },
  { href: "/admin/faturamento", soAdmin: true },
  { href: "/admin/movies", soAdmin: false },
  { href: "/admin/importar", soAdmin: true },
  { href: "/admin/bulk-images", soAdmin: true },
  { href: "/admin/categories", soAdmin: true },
  { href: "/admin/users", soAdmin: false },
  { href: "/admin/colaboradores", soAdmin: true },
  { href: "/admin/guest-tokens", soAdmin: true },
  { href: "/admin/notifications", soAdmin: true },
  { href: "/admin/settings", soAdmin: true },
];

/** O colaborador pode abrir esta página? */
export function podeAbrir(href: string, papel: string | undefined) {
  if (papel === "admin") return true;
  if (papel !== "colaborador") return false;
  // A mais específica ganha: /admin/movies/123 herda a regra de /admin/movies.
  const regra = [...PAGINAS_DO_PAINEL]
    .sort((a, b) => b.href.length - a.href.length)
    .find((p) => href === p.href || href.startsWith(p.href + "/"));
  return regra ? !regra.soAdmin : false;
}
