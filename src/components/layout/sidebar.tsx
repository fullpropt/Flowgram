"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/ideas",
    label: "Banco de Ideias",
    description: "Capture e refine temas",
    icon: Lightbulb,
  },
  {
    href: "/calendar",
    label: "Calendario",
    description: "Planeje a publicacao",
    icon: CalendarDays,
  },
];

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface SidebarBodyProps {
  collapsed: boolean;
  pathname: string;
  onNavigate?: () => void;
}

function SidebarBody({ collapsed, pathname, onNavigate }: SidebarBodyProps) {
  return (
    <div className="panel-soft flex h-full flex-col gap-4 p-4 md:gap-5 md:p-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[linear-gradient(145deg,rgba(248,87,178,0.14),rgba(168,60,255,0.12),rgba(255,154,60,0.08))] p-3.5">
        <div className={cn("mb-2 flex items-center gap-2", collapsed && "mb-0 justify-center")}>
          <div className="rounded-lg border border-[#5f3a84] bg-[rgba(28,16,47,0.9)] p-2 shadow-[0_8px_20px_rgba(5,3,10,0.5)]">
            <Sparkles className="h-4 w-4 text-[var(--primary)]" />
          </div>
          <p className={cn("text-sm font-bold text-[var(--foreground)]", collapsed && "hidden")}>
            Flowgram
          </p>
        </div>
        <p
          className={cn(
            "text-xs leading-relaxed text-[var(--muted)]",
            collapsed && "hidden",
          )}
        >
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
                collapsed && "px-2.5",
                isActive
                  ? "border-[#8a54bc] bg-[rgba(31,18,52,0.9)] shadow-[0_10px_24px_rgba(3,2,7,0.45)]"
                  : "border-transparent hover:border-[#4b326c] hover:bg-[rgba(24,14,41,0.78)]",
              )}
              href={item.href}
              key={item.href}
              onClick={onNavigate}
              title={item.label}
            >
              <div className={cn("flex items-start gap-3", collapsed && "justify-center")}>
                <div
                  className={cn(
                    "rounded-lg border p-2",
                    isActive
                      ? "border-[#66438c] bg-[rgba(248,87,178,0.12)] text-[#ffb5f3]"
                      : "border-[#3a2a57] bg-[rgba(21,13,35,0.88)] text-[#bba5dd] group-hover:text-[#dcc9ff]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className={cn("min-w-0", collapsed && "hidden")}>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isActive ? "text-[#ffd2f4]" : "text-[#d8caef]",
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

      <div
        className={cn(
          "mt-auto rounded-xl border border-[var(--border)] bg-[rgba(20,12,34,0.85)] p-3",
          collapsed && "hidden",
        )}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          Dica rapida
        </p>
        <p className="mt-1 text-xs text-[#c7b8e4]">
          Use a busca e os filtros para acelerar a selecao de cards antes de
          arrastar para o calendario.
        </p>
      </div>
    </div>
  );
}

export function Sidebar({
  collapsed = false,
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <button
        aria-hidden={!mobileOpen}
        aria-label="Fechar menu lateral"
        className={cn(
          "fixed inset-0 z-30 bg-[rgba(3,2,8,0.65)] transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onCloseMobile}
        type="button"
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 p-3 transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarBody collapsed={false} onNavigate={onCloseMobile} pathname={pathname} />
      </aside>

      <aside
        className={cn(
          "hidden px-3 py-3 md:sticky md:top-0 md:block md:h-screen md:px-5 md:py-5",
          "transition-[width] duration-300",
          collapsed ? "md:w-24" : "md:w-80",
        )}
      >
        <SidebarBody collapsed={collapsed} pathname={pathname} />
      </aside>
    </>
  );
}
