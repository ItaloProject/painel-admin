import sql from "@/lib/db";
import { Users, TrendingUp, Activity, ShieldCheck } from "lucide-react";

async function getStats() {
  const [users, active, leads] = await Promise.all([
    sql`SELECT COUNT(*)::int AS n FROM app_users`.then(r => r[0].n as number),
    sql`SELECT COUNT(*)::int AS n FROM app_users WHERE subscription_active = true`.then(r => r[0].n as number).catch(() => 0),
    sql`SELECT COUNT(*)::int AS n FROM leads`.then(r => r[0].n as number).catch(() => 0),
  ]);
  return { users, active, leads };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Total de usuários", value: stats.users, icon: Users, color: "text-blue-500" },
    { label: "Assinaturas ativas", value: stats.active, icon: TrendingUp, color: "text-emerald-500" },
    { label: "Leads cadastrados", value: stats.leads, icon: Activity, color: "text-amber-500" },
    { label: "Admins", value: 1, icon: ShieldCheck, color: "text-purple-500" },
  ];

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do MUVO</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">Status do sistema</h2>
        <p className="text-xs text-muted-foreground">Banco de dados conectado ao Supabase (pooler transação)</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 font-medium">Online</span>
        </div>
      </div>
    </div>
  );
}
