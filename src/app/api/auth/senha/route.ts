import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";
import { log } from "@/lib/auditoria";

/** Hash atual: DB primeiro, depois env var. */
async function getCurrentHash(): Promise<string> {
  try {
    const rows = await sql`SELECT value FROM muvo_config WHERE key = 'admin_password_hash' LIMIT 1`;
    if (rows.length) return String(rows[0].value).trim();
  } catch { /* fallback */ }
  const b64 = (process.env.ADMIN_PASSWORD_HASH_B64 ?? "").trim();
  return b64 ? Buffer.from(b64, "base64").toString("utf8").trim() : "";
}

export async function POST(req: NextRequest) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { senhaAtual, senhaNova } = await req.json().catch(() => ({}));

  if (!senhaAtual || !senhaNova) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }
  if (String(senhaNova).length < 8) {
    return NextResponse.json({ error: "A nova senha precisa ter pelo menos 8 caracteres." }, { status: 400 });
  }

  const hash = await getCurrentHash();
  if (!hash || !(await bcrypt.compare(String(senhaAtual), hash))) {
    return NextResponse.json({ error: "Senha atual incorreta." }, { status: 401 });
  }

  const novoHash = await bcrypt.hash(String(senhaNova), 12);

  await sql`
    INSERT INTO muvo_config (key, value, atualizado_em)
    VALUES ('admin_password_hash', ${novoHash}, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, atualizado_em = now()
  `;

  await log("senha", "configuracao", "admin_password_hash");
  return NextResponse.json({ ok: true });
}
