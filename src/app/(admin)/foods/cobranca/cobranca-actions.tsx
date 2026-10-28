"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Cobranca } from "@/lib/cobrancas";

export function PagarBtn({ cobranca }: { cobranca: Cobranca }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(cobranca.status);

  async function toggle() {
    setLoading(true);
    const next = status === "pago" ? "pendente" : "pago";
    const res = await fetch(`/api/foods/cobrancas/${cobranca.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) setStatus(next);
    setLoading(false);
  }

  const pago = status === "pago";

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={pago ? "Desmarcar pagamento" : "Marcar como pago"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
        pago
          ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25"
          : status === "atrasado"
          ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : pago ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <Circle className="h-3.5 w-3.5" />
      )}
      {pago ? "Pago" : status === "atrasado" ? "Atrasado" : "Pendente"}
    </button>
  );
}
