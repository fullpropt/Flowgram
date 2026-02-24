"use client";

import { useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { WandSparkles } from "lucide-react";
import { CardItem } from "@/components/cards/card-item";
import { BoardColumns } from "@/components/organize/board-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/store/app-store";
import { IdeaCard } from "@/types/models";

function toDateInput(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function OrganizePage() {
  const cards = useAppStore((state) => state.cards);
  const hydrated = useAppStore((state) => state.hydrated);
  const openCardModal = useAppStore((state) => state.openCardModal);
  const generateWeekSuggestions = useAppStore(
    (state) => state.generateWeekSuggestions,
  );
  const scheduleWeekSuggestions = useAppStore(
    (state) => state.scheduleWeekSuggestions,
  );

  const [startDate, setStartDate] = useState(toDateInput(new Date()));
  const [includeConstrucao, setIncludeConstrucao] = useState(true);
  const [suggestions, setSuggestions] = useState<IdeaCard[]>([]);

  const cardsWithPillar = useMemo(
    () => cards.filter((card) => Boolean(card.pilar)),
    [cards],
  );

  const endDateLabel = useMemo(() => {
    const end = addDays(new Date(startDate), 6);
    return format(end, "dd/MM", { locale: ptBR });
  }, [startDate]);

  return (
    <div className="space-y-4">
      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Planejamento inteligente
            </p>
            <h2 className="text-xl font-bold text-slate-900">Gerar Semana</h2>
            <p className="text-sm text-slate-500">
              Sugere Dor, Educacao e Solucao. Construcao e opcional.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Inicio
              </label>
              <Input
                onChange={(event) => setStartDate(event.target.value)}
                type="date"
                value={startDate}
              />
            </div>

            <label className="flex h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-slate-700">
              <input
                checked={includeConstrucao}
                onChange={(event) => setIncludeConstrucao(event.target.checked)}
                type="checkbox"
              />
              Incluir Construcao
            </label>

            <Button
              onClick={() => {
                const generated = generateWeekSuggestions(
                  new Date(startDate).toISOString(),
                  includeConstrucao,
                );
                setSuggestions(generated);
              }}
              variant="secondary"
            >
              <WandSparkles className="h-4 w-4" />
              Gerar Semana
            </Button>
          </div>
        </div>

        {suggestions.length > 0 ? (
          <div className="panel-soft mt-4 space-y-3 p-3">
            <p className="text-xs text-slate-500">
              Sugestoes para{" "}
              <strong>
                {format(new Date(startDate), "dd/MM", { locale: ptBR })} ate{" "}
                {endDateLabel}
              </strong>
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {suggestions.map((card) => (
                <CardItem
                  card={card}
                  compact
                  key={card.id}
                  onClick={() => openCardModal(card.id)}
                  showActions={false}
                />
              ))}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  scheduleWeekSuggestions(
                    new Date(startDate).toISOString(),
                    includeConstrucao,
                  );
                }}
              >
                Agendar semana no calendario
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      {hydrated ? (
        <BoardColumns
          cards={cardsWithPillar}
          onOpenCard={(cardId) => openCardModal(cardId)}
        />
      ) : (
        <div className="panel p-5 text-sm text-slate-500">Carregando board...</div>
      )}
    </div>
  );
}
