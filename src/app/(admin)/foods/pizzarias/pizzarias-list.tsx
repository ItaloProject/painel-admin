"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Plus, Store, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PizzariaRow } from "@/lib/foods";
import { ActionBtn, Field, Modal, StatCard, inputCls, primaryBtn } from "@/components/ui-bits";

type ModalState = { type: "create" } | { type: "delete"; p: PizzariaRow } | null;

function slugify(s: string) {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 49);
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: PizzariaRow) => void }) {
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/foods/pizzarias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, slug }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erro ao criar"); return; }
    onCreated(data);
    onClose();
  }

  return (
    <Modal title="Nova pizzaria" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nome">
          <input
            className={inputCls} placeholder="Ex: Bella Massa" value={nome} required
            onChange={e => { setNome(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }}
          />
        </Field>
        <Field label="Slug (endereço do cardápio)" hint="Letras minúsculas, números e hífen.">
          <input
            className={inputCls} placeholder="bella-massa" value={slug} required
            onChange={e => { setSlugTouched(true); setSlug(e.target.value.toLowerCase()); }}
          />
        </Field>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className={primaryBtn}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Criar pizzaria
        </button>
      </form>
    </Modal>
  );
}

function DeleteModal({ p, onClose, onDeleted }: { p: PizzariaRow; onClose: () => void; onDeleted: (slug: string) => void }) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/foods/pizzarias/${p.slug}`, { method: "DELETE" });
    onDeleted(p.slug);
    onClose();
  }

  return (
    <Modal title="Excluir pizzaria" onClose={onClose}>
      <p className="text-sm text-muted-foreground mb-2">
        Excluir <span className="font-semibold text-foreground">{p.nome}</span>? O cardápio inteiro será apagado
        {p.acessos > 0 && <> e {p.acessos === 1 ? "o acesso do dono" : `os ${p.acessos} acessos`} dessa pizzaria também</>}.
      </p>
      <p className="text-sm text-muted-foreground mb-6">Esta ação não pode ser desfeita.</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">Cancelar</button>
        <button onClick={confirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Excluir
        </button>
      </div>
    </Modal>
  );
}

export function PizzariasList({ initial }: { initial: PizzariaRow[] }) {
  const [items, setItems] = useState(initial);
  const [modal, setModal] = useState<ModalState>(null);

  async function togglePublicado(p: PizzariaRow) {
    const res = await fetch(`/api/foods/pizzarias/${p.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicado: !p.publicado }),
    });
    if (res.ok) {
      const updated: PizzariaRow = await res.json();
      setItems(list => list.map(x => (x.slug === updated.slug ? updated : x)));
    }
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pizzarias</h1>
          <p className="text-muted-foreground text-sm mt-1">Cardápios digitais cadastrados no MUVO Foods</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-85 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Nova pizzaria
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total" value={items.length} />
        <StatCard label="Publicadas" value={items.filter(p => p.publicado).length} tone="text-emerald-500" />
        <StatCard label="Rascunhos" value={items.filter(p => !p.publicado).length} tone="text-muted-foreground" />
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {items.map(p => (
          <div key={p.slug} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors group">
            <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
            {/* Área clicável → detalhe */}
            <Link href={`/foods/pizzarias/${p.slug}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm truncate group-hover:underline underline-offset-2">
                  {p.nome}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  p.publicado ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                )}>
                  {p.publicado ? "Publicada" : "Rascunho"}
                </span>
                {p.acessos === 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">Sem dono</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                /{p.slug} · {p.categorias} categorias · {p.itens} itens · atualizada em{" "}
                {new Date(p.atualizado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
              </p>
            </Link>
            <div className="flex items-center gap-1 shrink-0">
              <ActionBtn title={p.publicado ? "Despublicar" : "Publicar"} onClick={() => togglePublicado(p)} active={p.publicado}>
                {p.publicado ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </ActionBtn>
              <ActionBtn title="Excluir" onClick={() => setModal({ type: "delete", p })} danger>
                <Trash2 className="h-4 w-4" />
              </ActionBtn>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhuma pizzaria cadastrada ainda.</p>
        )}
      </div>

      {modal?.type === "create" && (
        <CreateModal onClose={() => setModal(null)} onCreated={p => setItems(list => [p, ...list])} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal p={modal.p} onClose={() => setModal(null)} onDeleted={slug => setItems(list => list.filter(x => x.slug !== slug))} />
      )}
    </>
  );
}
