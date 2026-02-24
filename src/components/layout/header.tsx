"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export function Header() {
  const pathname = usePathname();
  const openCardModal = useAppStore((state) => state.openCardModal);

  const routeTitle = useMemo(() => {
    if (pathname.includes("/organize")) return "Organizar";
    if (pathname.includes("/calendar")) return "Calendario";
    return "Banco de Ideias";
  }, [pathname]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-white/90 px-5 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted)]">
          Flowgram
        </p>
        <h1 className="text-base font-semibold">{routeTitle}</h1>
      </div>

      <div className="flex items-center gap-2">
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
    </header>
  );
}
