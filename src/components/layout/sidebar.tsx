"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, KanbanSquare, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/ideas",
    label: "Banco de Ideias",
    icon: Lightbulb,
  },
  {
    href: "/organize",
    label: "Organizar",
    icon: KanbanSquare,
  },
  {
    href: "/calendar",
    label: "Calendário",
    icon: CalendarDays,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-[var(--border)] bg-white/90 px-3 py-3 md:h-screen md:w-72 md:border-b-0 md:border-r md:px-4 md:py-5">
      <div className="mb-5 flex items-center gap-2 rounded-xl bg-[var(--secondary)] px-3 py-2">
        <Sparkles className="h-5 w-5 text-[var(--primary)]" />
        <div>
          <p className="text-sm font-bold">Flowgram</p>
          <p className="text-xs text-[var(--muted)]">Planejador visual</p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-auto md:flex-col">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                isActive
                  ? "bg-[#e8efff] text-[#1f4ed8]"
                  : "text-slate-600 hover:bg-slate-50",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
