import { listLogs, type LogEntry } from "@/lib/auditoria";
import { cn } from "@/lib/utils";
import {
  Ban, CheckCircle2, KeyRound, LogIn, Plus, Settings,
  Store, Trash2, UserMinus, UserPlus, ShieldAlert,
} from "lucide-react";

export const dynamic = "force-dynamic";

function icone(entry: LogEntry) {
  const cls = "h-4 w-4";
  const map: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
    "create:pizzaria":    { icon: <Plus className={cls} />,        bg: "bg-emerald-500/10", text: "text-emerald-600" },
    "update:pizzaria":    { icon: <Store className={cls} />,       bg: "bg-blue-500/10",    text: "text-blue-600"   },
    "delete:pizzaria":    { icon: <Trash2 className={cls} />,      bg: "bg-destructive/10", text: "text-destructive" },
    "create:acesso":      { icon: <UserPlus className={cls} />,    bg: "bg-emerald-500/10", text: "text-emerald-600" },
    "update:acesso":      { icon: <UserPlus className={cls} />,    bg: "bg-blue-500/10",    text: "text-blue-600"   },
    "delete:acesso":      { icon: <UserMinus className={cls} />,   bg: "bg-destructive/10", text: "text-destructive" },
    "bloquear:acesso":    { icon: <Ban className={cls} />,         bg: "bg-amber-500/10",   text: "text-amber-600"  },
    "desbloquear:acesso": { icon: <CheckCircle2 className={cls} />, bg: "bg-emerald-500/10", text: "text-emerald-600" },
    "login:sessao":       { icon: <LogIn className={cls} />,       bg: "bg-muted",          text: "text-muted-foreground" },
    "senha:configuracao": { icon: <KeyRound className={cls} />,    bg: "bg-amber-500/10",   text: "text-amber-600"  },
  };
  const key = `${entry.acao}:${entry.entidade}`;
  return map[key] ?? { icon: <Settings className={cls} />, bg: "bg-muted", text: "text-muted-foreground" };
}

function descricao(entry: LogEntry): string {
  const ref = entry.referencia ?? "";
  const d = entry.detalhe ?? {};
  switch (`${entry.acao}:${entry.entidade}`) {
    case "create:pizzaria":    return `Pizzaria criada: /${ref}${d.nome ? ` (${d.nome})` : ""}`;
    case "update:pizzaria":    return typeof d.publicado === "boolean"
      ? `Pizzaria /${ref} ${d.publicado ? "publicada" : "despublicada"}`
      : `Pizzaria /${ref} atualizada`;
    case "delete:pizzaria":    return `Pizzaria /${ref} excluída`;
    case "create:acesso":      return `Acesso criado: ${ref} como ${d.papel ?? ""}${d.pizzaria_slug ? ` (/${d.pizzaria_slug})` : ""}`;
    case "update:acesso":      return `Acesso de ${ref} atualizado`;
    case "delete:acesso":      return `Acesso de ${ref} removido`;
    case "bloquear:acesso":    return `${ref} bloqueado`;
    case "desbloquear:acesso": return `${ref} desbloqueado`;
    case "login:sessao":       return `Login: ${ref}`;
    case "senha:configuracao": return "Senha do painel alterada";
    default:                   return `${entry.acao} · ${entry.entidade}${ref ? ` · ${ref}` : ""}`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function AuditoriaPage() {
  const logs = await listLogs(200);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Histórico de ações — {logs.length} evento{logs.length !== 1 ? "s" : ""} registrado{logs.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">Os eventos aparecerão aqui à medida que ações forem realizadas no painel.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {logs.map(entry => {
            const { icon, bg, text } = icone(entry);
            return (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-accent/20 transition-colors">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", bg, text)}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{descricao(entry)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDate(entry.criado_em)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
