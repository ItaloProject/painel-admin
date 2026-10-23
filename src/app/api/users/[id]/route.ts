import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import sql from "@/lib/db";
import { requireAdminSession } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  if (typeof body.is_active === "boolean") {
    await sql`UPDATE app_users SET is_active = ${body.is_active} WHERE id = ${id}`;
  }
  if (typeof body.bot_enabled === "boolean") {
    const plan = body.bot_enabled ? "completo" : "assinante";
    await sql`UPDATE app_users SET bot_enabled = ${body.bot_enabled}, plan = ${plan} WHERE id = ${id}`;
  }
  if (body.name) {
    await sql`UPDATE app_users SET name = ${body.name} WHERE id = ${id}`;
  }
  if (body.color) {
    await sql`UPDATE app_users SET color = ${body.color} WHERE id = ${id}`;
  }
  if (body.plan === "assinante" || body.plan === "completo") {
    const withBot = body.plan === "completo";
    await sql`UPDATE app_users SET plan = ${body.plan}, bot_enabled = ${withBot} WHERE id = ${id}`;
  }
  if (body.paid_until !== undefined) {
    const until = body.paid_until ? String(body.paid_until).slice(0, 10) : null;
    await sql`UPDATE app_users SET paid_until = ${until} WHERE id = ${id}`;
  }
  if (typeof body.extend_days === "number" && body.extend_days > 0) {
    await sql`
      UPDATE app_users
      SET paid_until = (GREATEST(COALESCE(paid_until, CURRENT_DATE), CURRENT_DATE) + (${body.extend_days}::int))
      WHERE id = ${id}
    `;
  }
  if (body.password) {
    const hash = await bcrypt.hash(body.password, 12);
    await sql`UPDATE app_users SET password_hash = ${hash} WHERE id = ${id}`;
  }

  const [user] = await sql`
    SELECT id, user_id, username, name, color, is_active, is_admin, bot_enabled, plan, paid_until, created_at,
           (is_admin = true OR (paid_until IS NOT NULL AND paid_until::date >= CURRENT_DATE)) AS subscription_active
    FROM app_users WHERE id = ${id}
  `;
  return NextResponse.json(user);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminSession();
  if (denied) return denied;

  const { id } = await params;
  await sql`DELETE FROM app_users WHERE id = ${id} AND is_admin = false`;
  return NextResponse.json({ ok: true });
}
