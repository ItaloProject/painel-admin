import Link from "next/link";
import { ChevronLeft, ChevronRight, Receipt } from "lucide-react";
import { listPizzarias } from "@/lib/foods";
import { listCobrancas, mesAtual, resumo } from "@/lib/cobrancas";
import { cn } from "@/lib/utils";
import { PagarBtn } from "./cobranca-actions";

export const dynamic = "force-dynamic";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function labelMes(mes: string) {
  const [y, m] = mes.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function navMes(mes: string, delta: number): string {
  const [y, m] = mes.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function CobrancaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes: mesParam } = await searchParams;
  const mes = mesParam ?? mesAtual();

  const pizzarias = await listPizzarias();
  const slugsNomes = pizzarias.map(p => ({ slug: p.slug, nome: p.nome }));
  const cobrs = await listCobrancas(mes, slugsNomes);
  const res = resumo(cobrs);

  const prev = navMes(mes, -1);
  const next = navMes(mes, 1);
  const isCurrentMonth = mes === mesAtual();

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobrança</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{labelMes(mes)}</p>
        </div>
        {/* Navegação de mês */}
        <div className="flex items-center gap-1">
          <Link
            href={`/foods/cobranca?mes=${prev}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Link
            href={`/foods/cobranca?mes=${next}`}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg border border-border transition-colors",
              isCurrentMonth
                ? "opacity-30 pointer-events-none"
                : "hover:bg-accent"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total esperado",  value: brl(res.total),     tone: "" },
          { label: "Recebido",        value: brl(res.recebido),  tone: "text-emerald-500" },
          { label: "Pendente",        value: brl(res.pendente),  tone: "text-amber-500" },
          { label: "Atrasado",        value: brl(res.atrasado),  tone: "text-destructive" },
        ].map(({ label, value, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className={cn("text-xl font-bold tabular-nums", tone || "text-foreground")}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {cobrs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma pizzaria cadastrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {cobrs.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.pizzaria_nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  /{c.pizzaria_slug} · {brl(c.valor)}/mês
                  {c.pago_em && (
                    <> · Pago em {new Date(c.pago_em).toLocaleDateString("pt-BR")}</>
                  )}
                </p>
              </div>
              <PagarBtn cobranca={c} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
