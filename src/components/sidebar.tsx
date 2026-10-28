"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, LogOut, ShieldCheck,
  ChevronDown, Wallet, UtensilsCrossed, Check, Store, KeyRound, Settings, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

const APPS = [
  {
    id: "financeiro",
    label: "MUVO Financeiro",
    icon: Wallet,
    color: "bg-emerald-500",
    nav: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/usuarios", label: "Usuários", icon: Users },
      { href: "/auditoria", label: "Auditoria", icon: ShieldCheck },
    ],
  },
  {
    id: "foods",
    label: "MUVO Foods",
    icon: UtensilsCrossed,
    color: "bg-orange-500",
    nav: [
      { href: "/foods", label: "Dashboard", icon: LayoutDashboard },
      { href: "/foods/pizzarias", label: "Pizzarias", icon: Store },
      { href: "/foods/acessos", label: "Acessos", icon: KeyRound },
      { href: "/foods/cobranca", label: "Cobrança", icon: Receipt },
    ],
  },
] as const;

type AppId = (typeof APPS)[number]["id"];

const ROOT_HREFS: string[] = ["/", "/foods"];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const appId: AppId = pathname.startsWith("/foods") ? "foods" : "financeiro";
  const app = APPS.find(a => a.id === appId)!;
  const AppIcon = app.icon;

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  function selectApp(id: AppId) {
    setOpen(false);
    if (id !== appId) router.push(APPS.find(a => a.id === id)!.nav[0].href);
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]">
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 border-b border-[hsl(var(--sidebar-border))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-white.png" alt="MUVO" className="h-6 w-auto object-contain" />
        <span className="text-[10px] text-[hsl(var(--sidebar-foreground)/0.4)] font-medium border-l border-[hsl(var(--sidebar-border))] pl-3">Admin</span>
      </div>

      {/* App switcher */}
      <div className="px-2 pt-3 relative">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-[hsl(var(--sidebar-accent))] transition-colors group"
        >
          <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0 text-white", app.color)}>
            <AppIcon className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1 text-left min-w-0">
            <span className="block text-xs font-semibold text-[hsl(var(--sidebar-foreground))] truncate">{app.label}</span>
            <span className="block text-[10px] text-[hsl(var(--sidebar-foreground)/0.45)]">Aplicação ativa</span>
          </span>
          <ChevronDown className={cn("h-3.5 w-3.5 text-[hsl(var(--sidebar-foreground)/0.4)] transition-transform shrink-0", open && "rotate-180")} />
        </button>

        {open && (
          <div className="absolute left-2 right-2 top-full mt-1 z-50 rounded-xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-background))] shadow-xl overflow-hidden">
            {APPS.map(a => {
              const Icon = a.icon;
              const active = a.id === appId;
              return (
                <button
                  key={a.id}
                  onClick={() => selectApp(a.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
                >
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg shrink-0 text-white", a.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 text-left text-sm font-medium text-[hsl(var(--sidebar-foreground))] truncate">{a.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 mt-3 mb-1 border-t border-[hsl(var(--sidebar-border))/0.5]" />

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-1 px-2 flex flex-col gap-0.5">
        {app.nav.map(({ href, label, icon: Icon }) => {
          const active = ROOT_HREFS.includes(href) ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[hsl(var(--sidebar-primary)/0.15)] text-[hsl(var(--sidebar-primary))]"
                  : "text-[hsl(var(--sidebar-foreground)/0.65)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom links */}
      <div className="p-2 border-t border-[hsl(var(--sidebar-border))] flex flex-col gap-0.5">
        <Link
          href="/configuracoes"
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
            pathname === "/configuracoes"
              ? "bg-[hsl(var(--sidebar-primary)/0.15)] text-[hsl(var(--sidebar-primary))]"
              : "text-[hsl(var(--sidebar-foreground)/0.65)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))]"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Configurações
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[hsl(var(--sidebar-foreground)/0.65)] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-foreground))] transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sair
        </button>
      </div>
    </aside>
  );
}
