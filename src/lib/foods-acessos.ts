import sqlFoods from "@/lib/db-foods";

export type AcessoRow = {
  id: string;
  email: string;
  papel: "admin" | "dono";
  pizzaria_slug: string | null;
  pizzaria_nome: string | null;
  criado_em: string;
};

export async function listAcessos(): Promise<AcessoRow[]> {
  const rows = await sqlFoods`
    SELECT a.id::text AS id, a.email, a.papel, a.pizzaria_slug,
           p.pizzaria->>'nome' AS pizzaria_nome, a.criado_em
    FROM acessos a
    LEFT JOIN pizzarias p ON p.slug = a.pizzaria_slug
    ORDER BY (a.papel = 'admin') DESC, a.criado_em DESC
  `;
  return rows as unknown as AcessoRow[];
}

export async function getAcesso(id: string): Promise<AcessoRow | undefined> {
  return (await listAcessos()).find(a => a.id === id);
}

export async function otherAdminsCount(id: string): Promise<number> {
  const [{ n }] = await sqlFoods`
    SELECT COUNT(*)::int AS n FROM acessos WHERE papel = 'admin' AND id <> ${id}::bigint
  `;
  return n as number;
}
