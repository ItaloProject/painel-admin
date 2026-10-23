export const dynamic = "force-dynamic";

import sql from "@/lib/db";
import { UsuariosTable } from "./usuarios-table";

async function getUsers() {
  return sql`
    SELECT
      id, user_id, username, name, color,
      is_active, is_admin, bot_enabled, plan, paid_until, created_at,
      (is_admin = true OR (paid_until IS NOT NULL AND paid_until::date >= CURRENT_DATE)) AS subscription_active
    FROM app_users
    ORDER BY created_at DESC
  `;
}

export default async function UsuariosPage() {
  const users = await getUsers();
  return (
    <UsuariosTable initial={users as never} />
  );
}
