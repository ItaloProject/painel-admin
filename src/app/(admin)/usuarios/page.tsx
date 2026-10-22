import sql from "@/lib/db";
import { formatDistanceToNow } from "./utils";

type User = {
  id: string;
  name: string;
  color: string;
  is_admin: boolean;
  subscription_active: boolean;
  plan: string | null;
  paid_until: string | null;
  created_at: string;
};

async function getUsers(): Promise<User[]> {
  return sql`
    SELECT id, name, color, is_admin, subscription_active, plan, paid_until, created_at
    FROM app_users
    ORDER BY created_at DESC
  ` as unknown as User[];
}

export default async function UsuariosPage() {
  const users = await getUsers();

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">{users.length} usuários cadastrados</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Usuário</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Plano</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Válido até</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Criado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: u.color || "#666" }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{u.name}</p>
                      {u.is_admin && (
                        <span className="text-[10px] text-amber-600 font-semibold">Admin</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground capitalize">{u.plan ?? "—"}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    u.subscription_active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${u.subscription_active ? "bg-emerald-500" : "bg-red-400"}`} />
                    {u.subscription_active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">
                  {u.paid_until ? new Date(u.paid_until).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-5 py-3 text-muted-foreground text-xs">
                  {formatDistanceToNow(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
