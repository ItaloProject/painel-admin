import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, ExternalLink, Store } from "lucide-react";
import { getPizzaria, type Cardapio } from "@/lib/foods";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PrecoDisplay({ preco, tamanhos }: { preco: Record<string, number> | number; tamanhos: Cardapio["tamanhos"] }) {
  if (typeof preco === "number") return <span className="text-foreground font-semibold">{fmt(preco)}</span>;
  if (!tamanhos.length) {
    const vals = Object.values(preco);
    return <span className="text-foreground font-semibold">{vals.length ? fmt(Math.min(...vals)) : "—"}</span>;
  }
  return (
    <div className="flex gap-2 flex-wrap">
      {tamanhos.map(t => (
        preco[t.id] != null ? (
          <span key={t.id} className="flex flex-col items-center bg-muted rounded-lg px-2 py-1 min-w-[3rem]">
            <span className="text-[10px] font-semibold text-muted-foreground">{t.nome}</span>
            <span className="text-xs font-bold text-foreground">{fmt(preco[t.id])}</span>
          </span>
        ) : null
      ))}
    </div>
  );
}

export default async function PizzariaDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPizzaria(slug);
  if (!p) notFound();

  const { cardapio } = p;
  const totalItens = cardapio.categorias.reduce((s, c) => s + c.itens.length, 0);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
        <Link href="/foods/pizzarias" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" />
          Pizzarias
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{p.nome}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
          <Store className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold text-foreground">{p.nome}</h1>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              p.publicado ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
            )}>
              {p.publicado ? "Publicada" : "Rascunho"}
            </span>
            {p.acessos === 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">
                Sem dono
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            /{p.slug} · atualizada em{" "}
            {new Date(p.atualizado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {p.url_publica && (
              <a
                href={p.url_publica}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 hover:text-orange-500 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver cardápio público
              </a>
            )}
            <a
              href="https://painel-cardapio.pages.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Painel do cardápio (dono)
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {[
          { label: "Categorias", value: cardapio.categorias.length },
          { label: "Itens", value: totalItens },
          { label: "Tamanhos", value: cardapio.tamanhos.length },
          { label: "Adicionais", value: cardapio.adicionais.length },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tamanhos */}
      {cardapio.tamanhos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Tamanhos</h2>
          <div className="flex gap-2 flex-wrap">
            {cardapio.tamanhos.map(t => (
              <div key={t.id} className="rounded-xl border border-border bg-card px-4 py-2.5 text-center min-w-[80px]">
                <p className="text-xs font-bold text-foreground">{t.nome}</p>
                {t.detalhe && <p className="text-[10px] text-muted-foreground mt-0.5">{t.detalhe}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Bordas */}
      {cardapio.bordas.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Bordas</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {cardapio.bordas.map(b => (
              <div key={b.nome} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">{b.nome}</span>
                <span className="text-sm font-semibold text-foreground">{b.preco === 0 ? "Grátis" : fmt(b.preco)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Adicionais */}
      {cardapio.adicionais.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Adicionais</h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {cardapio.adicionais.map(a => (
              <div key={a.nome} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">{a.nome}</span>
                <span className="text-sm font-semibold text-foreground">{fmt(a.preco)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Cardápio por categoria */}
      {cardapio.categorias.length > 0 ? (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cardápio</h2>
          <div className="flex flex-col gap-6">
            {cardapio.categorias.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center gap-2 mb-3">
                  {cat.emoji && <span className="text-lg">{cat.emoji}</span>}
                  <h3 className="text-base font-semibold text-foreground">{cat.nome}</h3>
                  <span className="text-xs text-muted-foreground">({cat.itens.length} itens)</span>
                </div>
                <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {cat.itens.map(item => (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-0.5">
                            <span className="text-sm font-semibold text-foreground">{item.nome}</span>
                            {item.tags?.map(tag => (
                              <span key={tag} className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600">
                                {tag.replace(/-/g, " ")}
                              </span>
                            ))}
                          </div>
                          {item.descricao && (
                            <p className="text-xs text-muted-foreground">{item.descricao}</p>
                          )}
                        </div>
                        <div className="shrink-0">
                          <PrecoDisplay preco={item.preco} tamanhos={cardapio.tamanhos} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum item no cardápio ainda.</p>
        </div>
      )}
    </div>
  );
}
