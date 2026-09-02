/**
 * Campos que as listagens mandam pro navegador.
 *
 * Importante: NÃO inclui `videoUrl`. Antes as páginas usavam `include`, que
 * traz a tabela inteira — e o endereço do vídeo de todas as séries acabava
 * dentro do HTML público, dando pra assistir sem assinar. O link do vídeo só
 * pode sair na página de uma série, e só depois de checar o acesso.
 *
 * Também fica de fora o que a capinha não usa (descrição, banner, duração,
 * datas), porque com ~180 séries isso pesava megabytes em cada visita.
 */
export const SELECAO_CARD = {
  id: true,
  title: true,
  slug: true,
  thumbnail: true,
  rating: true,
  year: true,
  featured: true,
  categories: {
    select: { category: { select: { id: true, name: true, slug: true } } },
  },
} as const;

/** O destaque do topo da home mostra sinopse e banner, então precisa de mais. */
export const SELECAO_DESTAQUE = {
  ...SELECAO_CARD,
  description: true,
  bannerUrl: true,
} as const;
