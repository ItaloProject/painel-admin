import sqlFoods from "@/lib/db-foods";

export type PizzariaRow = {
  slug: string;
  nome: string;
  publicado: boolean;
  plano: "normal" | "premium";
  categorias: number;
  itens: number;
  acessos: number;
  atualizado_em: string;
};

export async function listPizzarias(): Promise<PizzariaRow[]> {
  const rows = await sqlFoods`
    SELECT
      p.slug,
      COALESCE(p.pizzaria->>'nome', p.slug) AS nome,
      p.publicado,
      p.plano,
      p.atualizado_em,
      CASE WHEN jsonb_typeof(p.cardapio->'categorias') = 'array'
           THEN jsonb_array_length(p.cardapio->'categorias') ELSE 0 END AS categorias,
      COALESCE((
        SELECT SUM(CASE WHEN jsonb_typeof(c->'itens') = 'array' THEN jsonb_array_length(c->'itens') ELSE 0 END)
        FROM jsonb_array_elements(
          CASE WHEN jsonb_typeof(p.cardapio->'categorias') = 'array' THEN p.cardapio->'categorias' ELSE '[]'::jsonb END
        ) c
      ), 0)::int AS itens,
      (SELECT COUNT(*) FROM acessos a WHERE a.pizzaria_slug = p.slug)::int AS acessos
    FROM pizzarias p
    ORDER BY p.atualizado_em DESC
  `;
  return rows as unknown as PizzariaRow[];
}

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,48}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ----- tipos do cardápio -----

export type Tamanho = { id: string; nome: string; detalhe?: string };
export type Borda   = { nome: string; preco: number };
export type Adicional = { nome: string; preco: number };
export type Item = {
  id: string;
  nome: string;
  descricao?: string;
  preco: Record<string, number> | number;
  tags?: string[];
};
export type Categoria = {
  id: string;
  nome: string;
  emoji?: string;
  itens: Item[];
};
export type Cardapio = {
  categorias: Categoria[];
  tamanhos: Tamanho[];
  bordas: Borda[];
  adicionais: Adicional[];
};

export type PizzariaDetalhe = {
  slug: string;
  nome: string;
  publicado: boolean;
  atualizado_em: string;
  acessos: number;
  url_publica?: string;
  cardapio: Cardapio;
};

export async function getPizzaria(slug: string): Promise<PizzariaDetalhe | null> {
  const rows = await sqlFoods`
    SELECT
      p.slug,
      COALESCE(p.pizzaria->>'nome', p.slug) AS nome,
      p.publicado,
      p.atualizado_em,
      p.cardapio,
      p.pizzaria->>'url_publica' AS url_publica,
      (SELECT COUNT(*) FROM acessos a WHERE a.pizzaria_slug = p.slug)::int AS acessos
    FROM pizzarias p
    WHERE p.slug = ${slug}
    LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0] as {
    slug: string; nome: string; publicado: boolean;
    atualizado_em: string; cardapio: unknown; acessos: number; url_publica?: string;
  };
  return { ...r, cardapio: (r.cardapio as Cardapio) ?? { categorias: [], tamanhos: [], bordas: [], adicionais: [] } };
}
