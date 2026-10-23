import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET() {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const rows = await sql`
    SELECT
      id, user_id, username, name, color,
      is_active, is_admin, bot_enabled, plan, paid_until, created_at,
      (is_admin = true OR (paid_until IS NOT NULL AND paid_until::date >= CURRENT_DATE)) AS subscription_active
    FROM app_users
    ORDER BY created_at DESC
  `;
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const body = await req.json().catch(() => ({}));
  const { username, name, password, color, is_admin, plan, paid_until } = body;

  if (!username || !name || !password) {
    return NextResponse.json({ error: "username, name e password são obrigatórios" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);
  const user_id = (username as string).toLowerCase().trim().replace(/\s+/g, "_");
  const withBot = plan === "completo";
  const until = paid_until ? String(paid_until).slice(0, 10) : null;

  try {
    const [user] = await sql`
      INSERT INTO app_users
        (user_id, username, name, password_hash, color, is_admin, bot_enabled, paid_until, plan, is_active)
      VALUES
        (${user_id}, ${(username as string).toLowerCase().trim()}, ${name}, ${hash},
         ${color ?? "#3b82f6"}, ${is_admin ?? false}, ${withBot}, ${until},
         ${plan ?? "assinante"}, true)
      RETURNING id, user_id, username, name, color, is_active, is_admin, bot_enabled, paid_until, plan, created_at
    `;
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Usuário já existe" }, { status: 409 });
  }
}
