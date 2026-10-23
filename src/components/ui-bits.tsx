"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground/70">{hint}</span>}
    </div>
  );
}

export function ActionBtn({
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
      aria-label={title}
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

export function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className={cn("text-2xl font-bold tabular-nums", tone)}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

export const primaryBtn =
  "flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-60";
