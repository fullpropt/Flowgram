"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const routeCopy: Record<string, { title: string; subtitle: string }> = {
  ideas: {
    title: "Banco de Ideias",
    subtitle: "Gerencie ideias com filtros rapidos e edicao detalhada.",
  },
  organize: {
    title: "Organizar",
    subtitle: "Distribua os cards entre pilares e monte sua semana.",
  },
  calendar: {
    title: "Calendario",
    subtitle: "Visual mensal e semanal para acompanhar agendamentos.",
  },
};

interface HeaderProps {
  isSidebarCollapsed?: boolean;
  onToggleMobileSidebar?: () => void;
  onToggleSidebar?: () => void;
}

export function Header({
  isSidebarCollapsed = false,
  onToggleMobileSidebar,
  onToggleSidebar,
}: HeaderProps) {
  const pathname = usePathname();
  const openCardModal = useAppStore((state) => state.openCardModal);

  const routeData = useMemo(() => {
    if (pathname.includes("/organize")) return routeCopy.organize;
    if (pathname.includes("/calendar")) return routeCopy.calendar;
    return routeCopy.ideas;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgba(11,7,20,0.7)] px-4 py-4 backdrop-blur md:px-6">
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
            Flowgram
          </p>
          <h1 className="text-lg font-bold text-[var(--foreground)]">{routeData.title}</h1>
          <p className="hidden text-sm text-[var(--muted)] md:block">{routeData.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="md:hidden"
            onClick={onToggleMobileSidebar}
            size="icon"
            variant="outline"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <Button
            className="hidden md:inline-flex"
            onClick={onToggleSidebar}
            size="icon"
            variant="outline"
          >
            <PanelLeft className={cn("h-4 w-4 transition-transform", isSidebarCollapsed && "rotate-180")} />
          </Button>
          <Button
            className="rounded-xl"
            onClick={() => {
              openCardModal(null);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo Card
          </Button>
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            size="icon"
            variant="outline"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
