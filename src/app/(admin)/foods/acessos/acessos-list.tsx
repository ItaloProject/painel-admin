"use client";

import { useState } from "react";
import { Loader2, Pencil, ShieldCheck, Store, Trash2, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AcessoRow } from "@/lib/foods-acessos";
import { ActionBtn, Field, Modal, StatCard, inputCls, primaryBtn } from "@/components/ui-bits";

type Pizzaria = { slug: string; nome: string };
type ModalState = { type: "form"; acesso?: AcessoRow } | { type: "delete"; acesso: AcessoRow } | null;

function AcessoModal({
  acesso, pizzarias, onClose, onSaved,
}: {
  acesso?: AcessoRow;
  pizzarias: Pizzaria[];
  onClose: () => void;
  onSaved: (a: AcessoRow) => void;
}) {
  const [email, setEmail] = useState(acesso?.email ?? "");
  const [papel, setPapel] = useState<"admin" | "dono">(acesso?.papel ?? "dono");
  const [slug, setSlug] = useState(acesso?.pizzaria_slug ?? pizzarias[0]?.slug ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(acesso ? `/api/foods/acessos/${acesso.id}` : "/api/foods/acessos", {
      method: acesso ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, papel, pizzaria_slug: papel === "dono" ? slug : null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erro ao salvar"); return; }
    onSaved(data);
    onClose();
  }

  return (
    <Modal title={acesso ? "Editar acesso" : "Novo acesso"} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="E-mail" hint={acesso ? "O e-mail não pode ser alterado. Crie um novo acesso se precisar." : undefined}>
          <input
            className={cn(inputCls, acesso && "opacity-60")} type="email" placeholder="dono@pizzaria.com"
            value={email} onChange={e => setEmail(e.target.value)} required disabled={!!acesso}
          />
        </Field>
        <Field label="Papel">
          <div className="flex rounded-xl border border-border overflow-hidden text-sm">
            {(["dono", "admin"] as const).map(p => (
              <button key={p} type="button" onClick={() => setPapel(p)}
                className={cn("flex-1 py-2 font-medium transition-colors", papel === p ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
                {p === "dono" ? "Dono de pizzaria" : "Admin"}
              </button>
            ))}
          </div>
        </Field>
        {papel === "dono" ? (
          <Field label="Pizzaria">
            {pizzarias.length === 0 ? (
              <p className="text-xs text-muted-foreground">Cadastre uma pizzaria primeiro.</p>
            ) : (
              <select className={inputCls} value={slug} onChange={e => setSlug(e.target.value)} required>
                {pizzarias.map(p => <option key={p.slug} value={p.slug}>{p.nome} (/{p.slug})</option>)}
              </select>
            )}
          </Field>
        ) : (
          <p className="text-xs text-muted-foreground">Admin enxerga e edita todos os cardápios.</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={loading || (papel === "dono" && pizzarias.length === 0)} className={primaryBtn}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {acesso ? "Salvar" : "Liberar acesso"}
        </button>
      </form>
    </Modal>
  );
}

function DeleteModal({ acesso, onClose, onDeleted }: { acesso: AcessoRow; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/foods/acessos/${acesso.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Erro ao remover");
      setLoading(false);
      return;
    }
    onDeleted(acesso.id);
    onClose();
  }

  return (
    <Modal title="Remover acesso" onClose={onClose}>
      <p className="text-sm text-muted-foreground mb-6">
        Remover o acesso de <span className="font-semibold text-foreground">{acesso.email}</span>? Essa pessoa deixa de conseguir entrar no cardápio.
      </p>
      {error && <p className="text-xs text-destructive mb-4">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors">Cancelar</button>
        <button onClick={confirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Remover
        </button>
      </div>
    </Modal>
  );
}

export function AcessosList({ initial, pizzarias }: { initial: AcessoRow[]; pizzarias: Pizzaria[] }) {
  const [items, setItems] = useState(initial);
  const [modal, setModal] = useState<ModalState>(null);

  function upsert(a: AcessoRow) {
    setItems(list => (list.some(x => x.id === a.id) ? list.map(x => (x.id === a.id ? a : x)) : [a, ...list]));
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Acessos</h1>
          <p className="text-muted-foreground text-sm mt-1">Quem pode entrar e editar os cardápios</p>
        </div>
        <button
          onClick={() => setModal({ type: "form" })}
          className="flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-85 transition-opacity"
        >
          <UserPlus className="h-4 w-4" />
          Novo acesso
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Total" value={items.length} />
        <StatCard label="Admins" value={items.filter(a => a.papel === "admin").length} tone="text-emerald-500" />
        <StatCard label="Donos" value={items.filter(a => a.papel === "dono").length} />
      </div>

      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {items.map(a => (
          <div key={a.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
              a.papel === "admin" ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-500"
            )}>
              {a.papel === "admin" ? <ShieldCheck className="h-5 w-5" /> : <Store className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm truncate">{a.email}</span>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  a.papel === "admin" ? "bg-emerald-500/15 text-emerald-600" : "bg-orange-500/15 text-orange-600"
                )}>
                  {a.papel === "admin" ? "Admin" : "Dono"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {a.papel === "admin" ? "Todas as pizzarias" : `${a.pizzaria_nome ?? a.pizzaria_slug} (/${a.pizzaria_slug})`}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <ActionBtn title="Editar" onClick={() => setModal({ type: "form", acesso: a })}>
                <Pencil className="h-4 w-4" />
              </ActionBtn>
              <ActionBtn title="Remover" onClick={() => setModal({ type: "delete", acesso: a })} danger>
                <Trash2 className="h-4 w-4" />
              </ActionBtn>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nenhum acesso cadastrado.</p>
        )}
      </div>

      {modal?.type === "form" && (
        <AcessoModal acesso={modal.acesso} pizzarias={pizzarias} onClose={() => setModal(null)} onSaved={upsert} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal acesso={modal.acesso} onClose={() => setModal(null)} onDeleted={id => setItems(list => list.filter(x => x.id !== id))} />
      )}
    </>
  );
}
