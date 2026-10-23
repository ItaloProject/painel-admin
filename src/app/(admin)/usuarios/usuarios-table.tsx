"use client";

import { useState } from "react";
import {
  Calendar, Bot, KeyRound, Power, Trash2, UserPlus, X, Check, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  user_id: string;
  username: string;
  name: string;
  color: string;
  is_active: boolean;
  is_admin: boolean;
  bot_enabled: boolean;
  plan: string | null;
  paid_until: string | null;
  subscription_active: boolean;
  created_at: string;
};

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function isExpiringSoon(d: string | null) {
  if (!d) return false;
  const diff = (new Date(d).getTime() - Date.now()) / 86400000;
  return diff >= 0 && diff <= 7;
}

// ── Modais ──────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

// ── Create modal ─────────────────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [form, setForm] = useState({ username: "", name: "", password: "", color: "#3b82f6", plan: "assinante", paid_until: "", is_admin: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, paid_until: form.paid_until || null }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erro ao criar"); return; }
    onCreated(data);
    onClose();
  }

  return (
    <Modal title="Novo usuário" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nome">
          <input className={inputCls} placeholder="Ex: João Silva" value={form.name} onChange={e => set("name", e.target.value)} required />
        </Field>
        <Field label="Username">
          <input className={inputCls} placeholder="joao" value={form.username} onChange={e => set("username", e.target.value)} required />
        </Field>
        <Field label="Senha">
          <input className={inputCls} type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Plano">
            <select className={inputCls} value={form.plan} onChange={e => set("plan", e.target.value)}>
              <option value="assinante">Assinante</option>
              <option value="completo">Completo (Bot)</option>
            </select>
          </Field>
          <Field label="Cor do avatar">
            <div className="flex items-center gap-2">
              <input type="color" value={form.color} onChange={e => set("color", e.target.value)} className="h-9 w-14 rounded-lg border border-border bg-background cursor-pointer" />
              <span className="text-xs text-muted-foreground">{form.color}</span>
            </div>
          </Field>
        </div>
        <Field label="Válido até">
          <input className={inputCls} type="date" value={form.paid_until} onChange={e => set("paid_until", e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_admin} onChange={e => set("is_admin", e.target.checked)} className="rounded" />
          <span className="text-sm text-foreground">Marcar como Admin</span>
        </label>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Criar usuário
        </button>
      </form>
    </Modal>
  );
}

// ── Extend modal ─────────────────────────────────────────────────────────────

function ExtendModal({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: (u: User) => void }) {
  const [days, setDays] = useState(30);
  const [date, setDate] = useState(user.paid_until?.slice(0, 10) ?? "");
  const [mode, setMode] = useState<"days" | "date">("days");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body = mode === "days" ? { extend_days: days } : { paid_until: date || null };
    const res = await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setLoading(false);
    if (res.ok) { onUpdated(data); onClose(); }
  }

  return (
    <Modal title={`Assinatura — ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex rounded-xl border border-border overflow-hidden text-sm">
          {(["days", "date"] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={cn("flex-1 py-2 font-medium transition-colors", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent")}>
              {m === "days" ? "Estender dias" : "Definir data"}
            </button>
          ))}
        </div>
        {mode === "days" ? (
          <Field label="Quantidade de dias">
            <div className="flex items-center gap-3">
              {[7, 30, 90, 365].map(d => (
                <button key={d} type="button" onClick={() => setDays(d)}
                  className={cn("flex-1 rounded-xl py-2 text-xs font-semibold border transition-colors", days === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-accent")}>
                  {d}d
                </button>
              ))}
            </div>
            <input type="number" className={inputCls} value={days} onChange={e => setDays(Number(e.target.value))} min={1} />
          </Field>
        ) : (
          <Field label="Válido até">
            <input className={inputCls} type="date" value={date} onChange={e => setDate(e.target.value)} />
          </Field>
        )}
        <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Salvar
        </button>
      </form>
    </Modal>
  );
}

// ── Password modal ────────────────────────────────────────────────────────────

function PasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/users/${user.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    setLoading(false);
    setDone(true);
    setTimeout(onClose, 1200);
  }

  return (
    <Modal title={`Senha — ${user.name}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Nova senha">
          <input className={inputCls} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        </Field>
        <button type="submit" disabled={loading || done} className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60">
          {done ? <Check className="h-4 w-4" /> : loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          {done ? "Alterada!" : "Alterar senha"}
        </button>
      </form>
    </Modal>
  );
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await fetch(`/api/users/${user.id}`, { method: "DELETE" });
    onDeleted(user.id);
    onClose();
  }

  return (
    <Modal title="Excluir usuário" onClose={onClose}>
      <p className="text-sm text-muted-foreground mb-6">
        Tem certeza que deseja excluir <span className="font-semibold text-foreground">{user.name}</span>? Esta ação não pode ser desfeita.
      </p>
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

// ── Main table ────────────────────────────────────────────────────────────────

type Modal = { type: "extend" | "password" | "delete"; user: User } | { type: "create" } | null;

export function UsuariosTable({ initial }: { initial: User[] }) {
  const [users, setUsers] = useState(initial);
  const [modal, setModal] = useState<Modal>(null);

  const total = users.length;
  const ativos = users.filter(u => u.is_active && u.subscription_active).length;
  const inativos = users.filter(u => !u.is_active || !u.subscription_active).length;

  function update(updated: User) {
    setUsers(u => u.map(x => x.id === updated.id ? updated : x));
  }

  async function toggleActive(user: User) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !user.is_active }),
    });
    if (res.ok) update(await res.json());
  }

  async function toggleBot(user: User) {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot_enabled: !user.bot_enabled }),
    });
    if (res.ok) update(await res.json());
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
          <p className="text-muted-foreground text-sm mt-1">Gerencie o acesso ao MUVO</p>
        </div>
        <button
          onClick={() => setModal({ type: "create" })}
          className="flex items-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-85 transition-opacity"
        >
          <UserPlus className="h-4 w-4" />
          Novo usuário
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "Total", value: total, icon: "👥", color: "" },
          { label: "Ativos", value: ativos, icon: "⚡", color: "text-emerald-500" },
          { label: "Inativos", value: inativos, icon: "⏻", color: "text-muted-foreground" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border bg-card px-5 py-4">
            <p className={cn("text-2xl font-bold tabular-nums", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {users.map(u => {
          const dateStr = formatDate(u.paid_until);
          const expiring = isExpiringSoon(u.paid_until);

          return (
            <div key={u.id} className="flex items-center gap-4 px-5 py-4 hover:bg-accent/20 transition-colors">
              {/* Avatar */}
              <div
                className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ backgroundColor: u.color || "#666" }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground text-sm">{u.name}</span>
                  {u.is_admin && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      ✦ Admin
                    </span>
                  )}
                  {u.bot_enabled && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-500">
                      🤖 Bot
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                  <span className="text-muted-foreground/40 text-xs">·</span>
                  <span className="text-xs text-muted-foreground capitalize">{u.plan ?? "assinante"}</span>
                  {dateStr && (
                    <>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        expiring ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground"
                      )}>
                        Até {dateStr}
                      </span>
                    </>
                  )}
                  {!u.is_admin && (
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                      u.is_active && u.subscription_active
                        ? "bg-emerald-500/15 text-emerald-600"
                        : "bg-red-500/15 text-red-500"
                    )}>
                      {u.is_active && u.subscription_active ? "Ativo" : "Inativo"}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <ActionBtn title="Assinatura" onClick={() => setModal({ type: "extend", user: u })}>
                  <Calendar className="h-4 w-4" />
                </ActionBtn>
                <ActionBtn title={u.bot_enabled ? "Desativar bot" : "Ativar bot"} onClick={() => toggleBot(u)} active={u.bot_enabled}>
                  <Bot className="h-4 w-4" />
                </ActionBtn>
                <ActionBtn title="Alterar senha" onClick={() => setModal({ type: "password", user: u })}>
                  <KeyRound className="h-4 w-4" />
                </ActionBtn>
                {!u.is_admin && (
                  <>
                    <ActionBtn title={u.is_active ? "Desativar" : "Ativar"} onClick={() => toggleActive(u)} active={!u.is_active} danger={u.is_active}>
                      <Power className="h-4 w-4" />
                    </ActionBtn>
                    <ActionBtn title="Excluir" onClick={() => setModal({ type: "delete", user: u })} danger>
                      <Trash2 className="h-4 w-4" />
                    </ActionBtn>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {modal?.type === "create" && (
        <CreateModal
          onClose={() => setModal(null)}
          onCreated={u => setUsers(prev => [u, ...prev])}
        />
      )}
      {modal?.type === "extend" && (
        <ExtendModal user={modal.user} onClose={() => setModal(null)} onUpdated={update} />
      )}
      {modal?.type === "password" && (
        <PasswordModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === "delete" && (
        <DeleteModal
          user={modal.user}
          onClose={() => setModal(null)}
          onDeleted={id => setUsers(prev => prev.filter(x => x.id !== id))}
        />
      )}
    </>
  );
}

function ActionBtn({
  children, title, onClick, active, danger,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-lg p-2 transition-colors",
        danger ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          : active ? "text-primary bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
