"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, KanbanSquare, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/ideas",
    label: "Banco de Ideias",
    description: "Capture e refine temas",
    icon: Lightbulb,
  },
  {
    href: "/organize",
    label: "Organizar",
    description: "Distribua por pilares",
    icon: KanbanSquare,
  },
  {
    href: "/calendar",
    label: "Calendario",
    description: "Planeje a publicacao",
    icon: CalendarDays,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full px-3 py-3 md:sticky md:top-0 md:h-screen md:w-80 md:px-5 md:py-5">
      <div className="panel-soft flex h-full flex-col gap-4 p-4 md:gap-5 md:p-5">
        <div className="rounded-2xl bg-[#eff4ff] p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded-lg bg-white p-2 shadow-sm">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
            </div>
            <p className="text-sm font-bold">Flowgram</p>
          </div>
          <p className="text-xs leading-relaxed text-[var(--muted)]">
            Planejador visual para organizar ideias, estruturar pilares e manter o
            calendario de conteudo sempre atualizado.
          </p>
        </div>

        <nav className="grid gap-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                className={cn(
                  "group rounded-xl border px-3.5 py-3 transition",
                  isActive
                    ? "border-[#c9d8ff] bg-white shadow-sm"
                    : "border-transparent hover:border-[#d7e1f6] hover:bg-white/80",
                )}
                href={item.href}
                key={item.href}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "rounded-lg border p-2",
                      isActive
                        ? "border-[#d1ddff] bg-[#edf3ff] text-[var(--primary)]"
                        : "border-[#e2e8f0] bg-white text-slate-500 group-hover:text-slate-700",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-[var(--primary)]" : "text-slate-700",
                      )}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--muted)]">{item.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-[#e2e8f0] bg-white p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Dica rapida
          </p>
          <p className="mt-1 text-xs text-slate-600">
            Use a busca e os filtros para acelerar a selecao de cards antes de
            arrastar para o calendario.
          </p>
        </div>
      </div>
    </aside>
  );
}
