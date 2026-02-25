"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { CardModal } from "@/components/cards/card-modal";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { AppBootstrap } from "@/components/providers/app-bootstrap";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const trashedCardsCount = useAppStore((state) => state.trashedCards.length);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isTrashPage = pathname.includes("/trash");

  return (
    <div className="min-h-screen overflow-x-clip md:flex">
      <AppBootstrap />
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
        />
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <div className="mx-auto w-full max-w-[1360px] min-w-0">{children}</div>
        </main>
      </div>
      <Link
        aria-label="Abrir lixeira"
        className={cn(
          "fixed bottom-5 right-5 z-20 inline-flex h-12 w-12 items-center justify-center rounded-2xl border transition md:bottom-6 md:right-6",
          "shadow-[0_14px_30px_rgba(5,3,10,0.42)] backdrop-blur",
          isTrashPage
            ? "border-[#936451] bg-[linear-gradient(145deg,rgba(255,200,90,0.2),rgba(255,141,96,0.16),rgba(26,16,41,0.95))] text-[#ffe8c5]"
            : "border-[#68493d] bg-[linear-gradient(145deg,rgba(255,200,90,0.16),rgba(255,141,96,0.1),rgba(20,12,34,0.92))] text-[#ffd4a2] hover:-translate-y-[1px] hover:border-[#936451] hover:text-[#ffe8c5]",
        )}
        href="/trash"
        title="Lixeira"
      >
        <Trash2 className="h-5 w-5" />
        {trashedCardsCount > 0 ? (
          <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border border-[#704633] bg-[linear-gradient(135deg,#ffc85a,#ff8d60)] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-[#190d12] shadow-[0_6px_14px_rgba(255,141,96,0.35)]">
            {trashedCardsCount > 99 ? "99+" : trashedCardsCount}
          </span>
        ) : null}
      </Link>
      <CardModal />
    </div>
  );
}
