"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

const routeCopy: Record<string, { title: string; subtitle: string }> = {
  ideas: {
    title: "Banco de Ideias",
    subtitle: "",
  },
  organize: {
    title: "Organizar",
    subtitle: "Distribua os cards entre grupos e monte sua semana.",
  },
  calendar: {
    title: "Calendario",
    subtitle: "Visual mensal e semanal para acompanhar agendamentos.",
  },
  studio: {
    title: "Studio",
    subtitle: "",
  },
  trash: {
    title: "Lixeira",
    subtitle: "Restaure cards excluidos dentro da janela de 7 dias.",
  },
  labSettings: {
    title: "Configuracoes Lab",
    subtitle: "Defina grupos, objetivos e tags para organizar seus cards.",
  },
  accountSettings: {
    title: "Configuracao de Conta",
    subtitle: "Altere nome da conta e senha de acesso.",
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
    if (pathname.includes("/account-settings")) return routeCopy.accountSettings;
    if (pathname.includes("/studio")) return routeCopy.studio;
    if (pathname.includes("/settings")) return routeCopy.labSettings;
    if (pathname.includes("/trash")) return routeCopy.trash;
    if (pathname.includes("/organize")) return routeCopy.organize;
    if (pathname.includes("/calendar")) return routeCopy.calendar;
    return routeCopy.ideas;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 px-4 pt-4 md:px-6 md:pt-5">
      <div className="mx-auto w-full max-w-[1360px]">
        <div className="relative overflow-hidden rounded-2xl border border-[rgba(138,84,188,0.28)] bg-[linear-gradient(145deg,rgba(20,12,34,0.92),rgba(14,10,25,0.9),rgba(10,8,20,0.88))] px-4 py-3 shadow-[0_14px_34px_rgba(5,3,10,0.34)] backdrop-blur md:px-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-70"
          >
            <div className="absolute -left-8 top-0 h-20 w-32 rounded-full bg-[rgba(248,87,178,0.09)] blur-2xl" />
            <div className="absolute right-8 top-2 h-16 w-28 rounded-full bg-[rgba(67,210,255,0.06)] blur-2xl" />
          </div>

          <div className="relative flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex items-center gap-2 pt-0.5">
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
                  title={isSidebarCollapsed ? "Expandir menu" : "Retrair menu"}
                  variant="outline"
                >
                  <PanelLeft
                    className={cn("h-4 w-4 transition-transform", isSidebarCollapsed && "rotate-180")}
                  />
                </Button>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-soft)]">
                  Flowgram Lab
                </p>
                <h1 className="truncate text-lg font-bold leading-tight text-[var(--foreground)]">
                  {routeData.title}
                </h1>
                {routeData.subtitle ? (
                  <p className="hidden truncate text-xs text-[var(--muted)] xl:block">
                    {routeData.subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                className="rounded-xl"
                onClick={() => {
                  openCardModal(null);
                }}
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Novo Card
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
