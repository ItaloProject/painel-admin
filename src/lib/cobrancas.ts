import sql from "@/lib/db";
import sqlFoods from "@/lib/db-foods";

export interface ComissaoRow {
  pizzaria_slug: string;
  pizzaria_nome: string;
  pedidos_pix: number;
  centavos_total: number; // em centavos (inteiro)
}

export async function getCentavosMes(
  mes: string,
  slugsNomes: { slug: string; nome: string }[]
): Promise<ComissaoRow[]> {
  const mesDate = mesParaDate(mes);
  const rows = await sqlFoods<{
    pizzaria_slug: string;
    pedidos_pix: string;
    centavos_total: string;
  }[]>`
    SELECT
      pizzaria_slug,
      COUNT(*)::text                       AS pedidos_pix,
      COALESCE(SUM(centavos_pix), 0)::text AS centavos_total
    FROM pedidos
    WHERE pagamento = 'Pix'
      AND pagamento_status = 'confirmado'
      AND date_trunc('month', criado_em AT TIME ZONE 'America/Sao_Paulo')
          = date_trunc('month', ${mesDate}::date)
    GROUP BY pizzaria_slug
  `;
  const nomeMap = Object.fromEntries(slugsNomes.map(p => [p.slug, p.nome]));
  return rows.map(r => ({
    pizzaria_slug: r.pizzaria_slug,
    pizzaria_nome: nomeMap[r.pizzaria_slug] ?? r.pizzaria_slug,
    pedidos_pix: parseInt(r.pedidos_pix, 10),
    centavos_total: parseInt(r.centavos_total, 10),
  }));
}

export type StatusCobranca = "pago" | "pendente" | "atrasado";

export interface Cobranca {
  id: string;
  pizzaria_slug: string;
  pizzaria_nome: string;
  mes: string;        // ISO date string "YYYY-MM-DD"
  valor: number;
  status: StatusCobranca;
  pago_em: string | null;
  obs: string | null;
}

export interface CobrancaResumo {
  total: number;
  recebido: number;
  pendente: number;
  atrasado: number;
}

/** Retorna "YYYY-MM-DD" do primeiro dia do mês dado (ou mês atual). */
export function mesParaDate(mes: string): string {
  const [y, m] = mes.split("-").map(Number);
  return `${y}-${String(m).padStart(2, "0")}-01`;
}

/** "YYYY-MM" → Date (1º dia do mês). */
export function mesAtual(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Lista cobranças de um mês, auto-criando registros pendentes para
 * pizzarias que ainda não têm lançamento naquele mês.
 * Slugs e nomes das pizzarias vêm do banco de foods via JOIN (ou param).
 */
export async function listCobrancas(
  mes: string,
  slugsNomes: { slug: string; nome: string }[]
): Promise<Cobranca[]> {
  const mesDate = mesParaDate(mes);

  // Insere pendentes para quem ainda não tem
  if (slugsNomes.length > 0) {
    const slugs = slugsNomes.map(p => p.slug);
    // Bulk insert ignorando conflito
    for (const { slug } of slugsNomes) {
      await sql`
        INSERT INTO muvo_cobrancas (pizzaria_slug, mes, valor, status)
        VALUES (${slug}, ${mesDate}::date, 65.00, 'pendente')
        ON CONFLICT (pizzaria_slug, mes) DO NOTHING
      `;
    }
    // Marca atrasadas: pendentes de meses anteriores ao atual
    const hoje = new Date();
    const mesHoje = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`;
    if (mesDate < mesHoje) {
      await sql`
        UPDATE muvo_cobrancas
        SET status = 'atrasado'
        WHERE mes = ${mesDate}::date
          AND status = 'pendente'
          AND pizzaria_slug = ANY(${slugs}::text[])
      `;
    }
  }

  const rows = await sql<{
    id: string; pizzaria_slug: string; mes: string;
    valor: string; status: StatusCobranca;
    pago_em: string | null; obs: string | null;
  }[]>`
    SELECT id::text, pizzaria_slug, mes::text, valor::text, status, pago_em::text, obs
    FROM muvo_cobrancas
    WHERE mes = ${mesDate}::date
    ORDER BY pizzaria_slug
  `;

  const nomeMap = Object.fromEntries(slugsNomes.map(p => [p.slug, p.nome]));

  return rows.map(r => ({
    ...r,
    pizzaria_nome: nomeMap[r.pizzaria_slug] ?? r.pizzaria_slug,
    valor: parseFloat(r.valor),
  }));
}

export async function getCobranca(id: string): Promise<Cobranca | null> {
  const rows = await sql<{
    id: string; pizzaria_slug: string; mes: string;
    valor: string; status: StatusCobranca;
    pago_em: string | null; obs: string | null;
  }[]>`
    SELECT id::text, pizzaria_slug, mes::text, valor::text, status, pago_em::text, obs
    FROM muvo_cobrancas WHERE id = ${id}::bigint LIMIT 1
  `;
  if (!rows.length) return null;
  const r = rows[0];
  return { ...r, pizzaria_nome: r.pizzaria_slug, valor: parseFloat(r.valor) };
}

export async function marcarPago(id: string): Promise<void> {
  await sql`
    UPDATE muvo_cobrancas
    SET status = 'pago', pago_em = now()
    WHERE id = ${id}::bigint
  `;
}

export async function desmarcarPago(id: string): Promise<void> {
  await sql`
    UPDATE muvo_cobrancas
    SET status = 'pendente', pago_em = null
    WHERE id = ${id}::bigint
  `;
}

export function resumo(cobrs: Cobranca[]): CobrancaResumo {
  return cobrs.reduce(
    (acc, c) => {
      acc.total += c.valor;
      if (c.status === "pago") acc.recebido += c.valor;
      else if (c.status === "pendente") acc.pendente += c.valor;
      else acc.atrasado += c.valor;
      return acc;
    },
    { total: 0, recebido: 0, pendente: 0, atrasado: 0 }
  );
}
