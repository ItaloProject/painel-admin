import Link from "next/link";
import { ChevronLeft, ChevronRight, Receipt, Coins } from "lucide-react";
import { listPizzarias } from "@/lib/foods";
import { listCobrancas, getCentavosMes, mesAtual, resumo } from "@/lib/cobrancas";
import { cn } from "@/lib/utils";
import { PagarBtn } from "./cobranca-actions";

export const dynamic = "force-dynamic";

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function centavosParaBRL(c: number) {
  return (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  const [cobrs, comissoes] = await Promise.all([
    listCobrancas(mes, slugsNomes),
    getCentavosMes(mes, slugsNomes),
  ]);

  const res = resumo(cobrs);
  const totalCentavos = comissoes.reduce((s, c) => s + c.centavos_total, 0);
  const totalPedidosPix = comissoes.reduce((s, c) => s + c.pedidos_pix, 0);

  const prev = navMes(mes, -1);
  const next = navMes(mes, 1);
  const isCurrentMonth = mes === mesAtual();

  // Mapa de comissão por slug para exibir na linha
  const comissaoMap = Object.fromEntries(comissoes.map(c => [c.pizzaria_slug, c]));

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobrança</h1>
          <p className="text-muted-foreground text-sm mt-1 capitalize">{labelMes(mes)}</p>
        </div>
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
              isCurrentMonth ? "opacity-30 pointer-events-none" : "hover:bg-accent"
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Mensalidades ── */}
      <h2 className="text-sm font-semibold text-foreground mb-3">Mensalidades</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {[
          { label: "Total esperado", value: brl(res.total),    tone: "" },
          { label: "Recebido",       value: brl(res.recebido), tone: "text-emerald-500" },
          { label: "Pendente",       value: brl(res.pendente), tone: "text-amber-500" },
          { label: "Atrasado",       value: brl(res.atrasado), tone: "text-destructive" },
        ].map(({ label, value, tone }) => (
          <div key={label} className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className={cn("text-xl font-bold tabular-nums", tone || "text-foreground")}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {cobrs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-10 text-center mb-8">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma pizzaria cadastrada ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden mb-8">
          {cobrs.map(c => {
            const com = comissaoMap[c.pizzaria_slug];
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{c.pizzaria_nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    /{c.pizzaria_slug} · {brl(c.valor)}/mês
                    {c.pago_em && (
                      <> · Pago em {new Date(c.pago_em).toLocaleDateString("pt-BR")}</>
                    )}
                    {com && com.pedidos_pix > 0 && (
                      <> · <span className="text-emerald-600 font-medium">{com.pedidos_pix} Pix · +{centavosParaBRL(com.centavos_total)}</span></>
                    )}
                  </p>
                </div>
                <PagarBtn cobranca={c} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Comissão por venda ── */}
      <h2 className="text-sm font-semibold text-foreground mb-3">Comissão por venda (centavos Pix)</h2>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xl font-bold tabular-nums text-emerald-500">{centavosParaBRL(totalCentavos)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total recebido em centavos</p>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 py-3">
          <p className="text-xl font-bold tabular-nums text-foreground">{totalPedidosPix}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Pedidos Pix confirmados</p>
        </div>
      </div>

      {comissoes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-10 text-center">
          <Coins className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhum Pix confirmado neste mês.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {comissoes.map(c => (
            <div key={c.pizzaria_slug} className="flex items-center gap-4 px-5 py-3.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{c.pizzaria_nome}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  /{c.pizzaria_slug} · {c.pedidos_pix} pedido{c.pedidos_pix !== 1 ? "s" : ""} Pix confirmado{c.pedidos_pix !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-sm font-bold text-emerald-500 tabular-nums">
                +{centavosParaBRL(c.centavos_total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
