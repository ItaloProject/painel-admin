export const dynamic = "force-dynamic";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { listPizzarias } from "@/lib/foods";
import { listAcessos } from "@/lib/foods-acessos";
import { StatCard } from "@/components/ui-bits";

export default async function FoodsDashboard() {
  const [pizzarias, acessos] = await Promise.all([listPizzarias(), listAcessos()]);

  const publicadas = pizzarias.filter(p => p.publicado).length;
  const itens = pizzarias.reduce((s, p) => s + p.itens, 0);
  const donos = acessos.filter(a => a.papel === "dono").length;
  const semDono = pizzarias.filter(p => p.acessos === 0);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">MUVO Foods</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral dos cardápios digitais</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Pizzarias" value={pizzarias.length} />
        <StatCard label="Publicadas" value={publicadas} tone="text-emerald-500" />
        <StatCard label="Itens no cardápio" value={itens} />
        <StatCard label="Donos com acesso" value={donos} />
      </div>

      {semDono.length > 0 && (
        <div className="mb-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm">
          <p className="font-semibold text-amber-600">
            {semDono.length === 1 ? "1 pizzaria sem dono" : `${semDono.length} pizzarias sem dono`}
          </p>
          <p className="text-muted-foreground mt-0.5">
            {semDono.map(p => p.nome).join(", ")} — ninguém consegue editar {semDono.length === 1 ? "esse cardápio" : "esses cardápios"}.{" "}
            <Link href="/foods/acessos" className="underline underline-offset-2 text-foreground">Liberar acesso</Link>
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-foreground">Atualizadas recentemente</h2>
        <Link href="/foods/pizzarias" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Ver todas</Link>
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {pizzarias.slice(0, 5).map(p => (
          <div key={p.slug} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{p.nome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                /{p.slug} · {p.categorias} categorias · {p.itens} itens
              </p>
            </div>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
              p.publicado ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
            )}>
              {p.publicado ? "Publicada" : "Rascunho"}
            </span>
          </div>
        ))}
        {pizzarias.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma pizzaria cadastrada ainda.</p>
        )}
      </div>
    </>
  );
}
