"use client";

import { useMemo, useState } from "react";
import { addMinutes, format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, type EventProps, type View } from "react-big-calendar";
import withDragAndDrop, {
  type DragFromOutsideItemArgs,
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { X } from "lucide-react";
import { CardItem } from "@/components/cards/card-item";
import { CardPreviewModal } from "@/components/cards/card-preview-modal";
import { Button } from "@/components/ui/button";
import { CanalSymbol } from "@/components/ui/canal-symbol";
import { useAppStore } from "@/store/app-store";
import { CalendarPost, Canal } from "@/types/models";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource: CalendarPost;
}

const locales = { "pt-BR": ptBR };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { locale: ptBR }),
  getDay,
  locales,
});

const DragAndDropCalendar = withDragAndDrop<CalendarEvent, object>(Calendar);

function singleDayEventEnd(startIso: string) {
  return addMinutes(new Date(startIso), 30);
}

function normalizePostDate(start: Date, view: View) {
  const next = new Date(start);

  // In month view, dropping can produce all-day ranges.
  // Force a fixed daytime time so the event always stays in a single day.
  if (view === "month") {
    next.setHours(9, 0, 0, 0);
  }

  return next;
}

function CalendarEventContent({
  event,
  onDelete,
}: EventProps<CalendarEvent> & { onDelete: (eventId: string) => void }) {
  const canal = event.resource?.canal ?? "Feed";

  return (
    <div className="flex w-full items-center gap-1">
      <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[rgba(18,10,31,0.22)]">
        <CanalSymbol canal={canal} className="text-[#160a1f]" />
      </span>
      <span className="min-w-0 flex-1 truncate">{event.title}</span>
      <button
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded bg-[rgba(18,10,31,0.28)] text-[#160a1f] transition hover:bg-[rgba(18,10,31,0.4)]"
        onClick={(nativeEvent) => {
          nativeEvent.preventDefault();
          nativeEvent.stopPropagation();
          onDelete(event.id);
        }}
        onMouseDown={(nativeEvent) => {
          nativeEvent.preventDefault();
          nativeEvent.stopPropagation();
        }}
        title="Remover post"
        type="button"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function CalendarView() {
  const cards = useAppStore((state) => state.cards);
  const calendarPosts = useAppStore((state) => state.calendarPosts);
  const configuredGroups = useAppStore((state) => state.taxonomyConfig.grupos);
  const addCalendarPost = useAppStore((state) => state.addCalendarPost);
  const updateCard = useAppStore((state) => state.updateCard);
  const updateCalendarPost = useAppStore((state) => state.updateCalendarPost);
  const deleteCalendarPost = useAppStore((state) => state.deleteCalendarPost);
  const markCardStatus = useAppStore((state) => state.markCardStatus);
  const openCardModal = useAppStore((state) => state.openCardModal);

  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [availablePilarFilter, setAvailablePilarFilter] = useState("");
  const [previewState, setPreviewState] = useState<{
    cardId: string;
    canal?: Canal;
    calendarPostId?: string;
  } | null>(null);

  const draggedCard = cards.find((card) => card.id === draggedCardId);

  const events = useMemo<CalendarEvent[]>(
    () =>
      calendarPosts.map((post) => ({
        id: post.id,
        title: post.titulo,
        start: new Date(post.dataInicio),
        end: singleDayEventEnd(post.dataInicio),
        allDay: false,
        resource: post,
      })),
    [calendarPosts],
  );

  const previewCard = useMemo(
    () => cards.find((card) => card.id === previewState?.cardId) ?? null,
    [cards, previewState],
  );

  const unscheduledCards = useMemo(() => {
    const scheduledCardIds = new Set(
      calendarPosts
        .map((post) => post.ideaCardId)
        .filter((id): id is string => Boolean(id)),
    );

    return cards.filter((card) => {
      if (scheduledCardIds.has(card.id)) return false;
      if (!availablePilarFilter) return true;
      return card.pilar === availablePilarFilter;
    });
  }, [availablePilarFilter, calendarPosts, cards]);

  const availableGroupOptions = useMemo(() => {
    const seen = new Set<string>();
    const values: string[] = [];

    [...configuredGroups, ...(cards.map((card) => card.pilar).filter(Boolean) as string[])].forEach(
      (group) => {
        const next = group.trim();
        if (!next) return;
        const key = next.toLocaleLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        values.push(next);
      },
    );

    return values;
  }, [cards, configuredGroups]);

  const calendarRenderKey = useMemo(
    () =>
      calendarPosts
        .map((post) => `${post.id}:${post.dataInicio}`)
        .sort()
        .join("|"),
    [calendarPosts],
  );

  function handleDropFromOutside({ start }: DragFromOutsideItemArgs) {
    if (!draggedCard) return;
    const normalizedStart = normalizePostDate(new Date(start), currentView);

    addCalendarPost({
      ideaCardId: draggedCard.id,
      titulo: draggedCard.titulo,
      dataInicio: normalizedStart.toISOString(),
      canal:
        draggedCard.camadas.formato === "Reels"
          ? "Reels"
          : draggedCard.camadas.formato === "Story"
            ? "Story"
            : "Feed",
    });
    setDraggedCardId(null);
  }

  function handleMoveEvent({ event, start }: EventInteractionArgs<CalendarEvent>) {
    const normalizedStart = normalizePostDate(new Date(start), currentView);
    updateCalendarPost(event.id, {
      dataInicio: normalizedStart.toISOString(),
    });
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
      <section className="panel flex h-[360px] min-h-0 flex-col p-4 xl:h-[760px]">
        <h2 className="mb-1 text-sm font-bold text-[var(--foreground)]">{"Cards dispon\u00EDveis"}</h2>
        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)]">
          Arraste um card para uma data no calendario.
        </p>

        <label className="mb-3 grid gap-1">
          <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
            Grupo
          </span>
          <select
            aria-label="Grupo"
            className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
            onChange={(event) => setAvailablePilarFilter(event.target.value)}
            value={availablePilarFilter}
          >
            <option value="">Todos</option>
            {availableGroupOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {unscheduledCards.map((card) => (
            <CardItem
              card={card}
              compact
              draggable
              key={card.id}
              onClick={() => setPreviewState({ cardId: card.id })}
              onDragStart={() => setDraggedCardId(card.id)}
              onEdit={() => openCardModal(card.id)}
              showActions={false}
            />
          ))}
          {unscheduledCards.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[rgba(20,12,34,0.85)] px-3 py-4 text-sm text-[var(--muted)]">
              {"Nenhum card dispon\u00EDvel com o filtro atual."}
            </p>
          ) : null}
        </div>
      </section>

      <section className="min-h-[760px] min-w-0">
        <DndProvider backend={HTML5Backend}>
          <DragAndDropCalendar
            key={calendarRenderKey}
            allDayAccessor={() => false}
            culture="pt-BR"
            components={{
              event: (props) => (
                <CalendarEventContent
                  {...props}
                  onDelete={(eventId) => {
                    deleteCalendarPost(eventId);
                    if (previewState?.calendarPostId === eventId) setPreviewState(null);
                  }}
                />
              ),
            }}
            date={currentDate}
            dragFromOutsideItem={() =>
              draggedCard
                ? {
                    id: draggedCard.id,
                    title: draggedCard.titulo,
                    start: new Date(),
                    end: addMinutes(new Date(), 30),
                    allDay: false,
                    resource: {
                      canal:
                        draggedCard.camadas.formato === "Reels"
                          ? "Reels"
                          : draggedCard.camadas.formato === "Story"
                            ? "Story"
                            : "Feed",
                    } as CalendarPost,
                  }
                : (null as unknown as CalendarEvent)
            }
            endAccessor="end"
            events={events}
            localizer={localizer}
            messages={{
              today: "Hoje",
              previous: "Anterior",
              next: "Proximo",
              month: "Mes",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Horario",
              event: "Evento",
              noEventsInRange: "Sem posts neste periodo.",
              showMore: (total) => `+${total} mais`,
            }}
            onDropFromOutside={handleDropFromOutside}
            onDragOver={(event) => event.preventDefault()}
            onEventDrop={handleMoveEvent}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            onSelectEvent={(event) => {
              if (!event.resource.ideaCardId) return;
              setPreviewState({
                cardId: event.resource.ideaCardId,
                canal: event.resource.canal,
                calendarPostId: event.id,
              });
            }}
            onView={setCurrentView}
            popup
            resizable={false}
            selectable
            startAccessor="start"
            style={{ height: 760 }}
            view={currentView}
          />
        </DndProvider>
      </section>

      <CardPreviewModal
        canal={previewState?.canal}
        card={previewCard}
        extraActions={
          previewState?.calendarPostId ? (
            <>
              <Button
                onClick={() => {
                  deleteCalendarPost(previewState.calendarPostId!);
                  setPreviewState(null);
                }}
                variant="danger"
              >
                Remover post
              </Button>
              <Button
                onClick={() => {
                  markCardStatus(previewState.cardId, "Publicado");
                  setPreviewState(null);
                }}
              >
                Marcar como Publicado
              </Button>
            </>
          ) : null
        }
        onEdit={previewCard ? () => openCardModal(previewCard.id) : undefined}
        onQuickRename={(cardId, nextTitle) => {
          updateCard(cardId, { titulo: nextTitle });
          if (previewState?.calendarPostId) {
            updateCalendarPost(previewState.calendarPostId, { titulo: nextTitle });
          }
        }}
        onOpenChange={(open) => {
          if (!open) setPreviewState(null);
        }}
        open={Boolean(previewCard)}
      />
    </div>
  );
}



