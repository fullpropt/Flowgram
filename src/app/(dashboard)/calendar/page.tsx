"use client";

import { CalendarView } from "@/components/calendar/calendar-view";
import { useAppStore } from "@/store/app-store";

export default function CalendarPage() {
  const hydrated = useAppStore((state) => state.hydrated);

  if (!hydrated) {
    return (
      <div className="panel p-5 text-sm text-[var(--muted)]">
        Carregando calendario...
      </div>
    );
  }

  return <CalendarView />;
}
