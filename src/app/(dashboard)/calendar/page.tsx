"use client";

import { CalendarView } from "@/components/calendar/calendar-view";
import { useAppStore } from "@/store/app-store";

export default function CalendarPage() {
  const hydrated = useAppStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-slate-500">
        Carregando calendario...
      </div>
    );
  }

  return <CalendarView />;
}
