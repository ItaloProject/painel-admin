import sql from "@/lib/db";

export type Acao = "create" | "update" | "delete" | "login" | "logout" | "senha" | "bloquear" | "desbloquear";
export type Entidade = "pizzaria" | "acesso" | "sessao" | "configuracao";

export interface LogEntry {
  id: string;
  acao: Acao;
  entidade: Entidade;
  referencia: string | null;
  detalhe: Record<string, unknown> | null;
  criado_em: string;
}

/** Grava um evento de auditoria. Nunca lança — falha silenciosa para não quebrar a ação principal. */
export async function log(
  acao: Acao,
  entidade: Entidade,
  referencia?: string | null,
  detalhe?: Record<string, unknown> | null,
): Promise<void> {
  try {
    await sql`
      INSERT INTO muvo_auditoria (acao, entidade, referencia, detalhe)
      VALUES (${acao}, ${entidade}, ${referencia ?? null}, ${detalhe ? JSON.stringify(detalhe) : null}::jsonb)
    `;
  } catch {
    /* falha silenciosa */
  }
}

/** Lista os últimos N eventos. */
export async function listLogs(limit = 100): Promise<LogEntry[]> {
  const rows = await sql`
    SELECT id::text, acao, entidade, referencia, detalhe, criado_em
    FROM muvo_auditoria
    ORDER BY criado_em DESC
    LIMIT ${limit}
  `;
  return rows as unknown as LogEntry[];
}
