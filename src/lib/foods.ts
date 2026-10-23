import sqlFoods from "@/lib/db-foods";

export type PizzariaRow = {
  slug: string;
  nome: string;
  publicado: boolean;
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
