"use client";

import { useMemo, useState } from "react";
import { addMinutes, format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  dateFnsLocalizer,
  type EventProps,
  type SlotInfo,
  type View,
} from "react-big-calendar";
import withDragAndDrop, {
  type DragFromOutsideItemArgs,
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { X } from "lucide-react";
import { CardItem } from "@/components/cards/card-item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PILARES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { CalendarPost, Canal, Pilar } from "@/types/models";

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

function canalFromPrompt(value: string | null): Canal {
  if (value === "Reels") return "Reels";
  if (value === "Story") return "Story";
  return "Feed";
}

function singleDayEventEnd(startIso: string) {
  return addMinutes(new Date(startIso), 30);
}

function normalizePostDate(start: Date, view: View) {
  const next = new Date(start);

  // In month view, dropping/selecting can produce all-day ranges.
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
  return (
    <div className="flex w-full items-center gap-1">
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
  const addCalendarPost = useAppStore((state) => state.addCalendarPost);
  const updateCalendarPost = useAppStore((state) => state.updateCalendarPost);
  const deleteCalendarPost = useAppStore((state) => state.deleteCalendarPost);
  const markCardStatus = useAppStore((state) => state.markCardStatus);

  const [currentView, setCurrentView] = useState<View>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [availablePilarFilter, setAvailablePilarFilter] = useState<Pilar | "">("");

  const draggedCard = cards.find((card) => card.id === draggedCardId);

  const events = useMemo<CalendarEvent[]>(
    () =>
      calendarPosts.map((post) => ({
        id: post.id,
        title: `${post.titulo} (${post.canal})`,
        start: new Date(post.dataInicio),
        end: singleDayEventEnd(post.dataInicio),
        allDay: false,
        resource: post,
      })),
    [calendarPosts],
  );

  const selectedPost = useMemo(
    () => calendarPosts.find((post) => post.id === selectedPostId),
    [calendarPosts, selectedPostId],
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

  const calendarRenderKey = useMemo(
    () =>
      calendarPosts
        .map((post) => `${post.id}:${post.dataInicio}`)
        .sort()
        .join("|"),
    [calendarPosts],
  );

  function handleCreateFromSlot(slot: SlotInfo) {
    const titulo = window.prompt("Titulo do post:");
    if (!titulo) return;
    const canalInput = window.prompt("Canal (Feed/Reels/Story)", "Feed");
    const normalizedStart = normalizePostDate(new Date(slot.start), currentView);
    addCalendarPost({
      titulo,
      dataInicio: normalizedStart.toISOString(),
      canal: canalFromPrompt(canalInput),
    });
  }

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
        <h2 className="mb-1 text-sm font-bold text-[var(--foreground)]">Cards disponiveis</h2>
        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)]">
          Arraste um card para uma data no calendario.
        </p>

        <select
          className="mb-3 h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
          onChange={(event) => setAvailablePilarFilter(event.target.value as Pilar | "")}
          value={availablePilarFilter}
        >
          <option value="">Todos os pilares</option>
          {PILARES.map((pilar) => (
            <option key={pilar} value={pilar}>
              {pilar}
            </option>
          ))}
        </select>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {unscheduledCards.map((card) => (
            <CardItem
              card={card}
              compact
              draggable
              key={card.id}
              onClick={() => undefined}
              onDragStart={() => setDraggedCardId(card.id)}
              showActions={false}
            />
          ))}
          {unscheduledCards.length === 0 ? (
            <p className="rounded-xl border border-[var(--border)] bg-[rgba(20,12,34,0.85)] px-3 py-4 text-sm text-[var(--muted)]">
              Nenhum card disponivel com o filtro atual.
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
                    if (selectedPostId === eventId) setSelectedPostId(null);
                  }}
                />
              ),
            }}
            date={currentDate}
            dragFromOutsideItem={() =>
              draggedCard
                ? {
                    id: draggedCard.id,
                    title: `${draggedCard.titulo} (${draggedCard.camadas.formato ?? "Feed"})`,
                    start: new Date(),
                    end: addMinutes(new Date(), 30),
                    allDay: false,
                    resource: {} as CalendarPost,
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
              setSelectedPostId(event.id);
              setNotesDraft(event.resource.observacoes ?? "");
            }}
            onSelectSlot={handleCreateFromSlot}
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

      <Dialog
        onOpenChange={(open) => {
          if (!open) setSelectedPostId(null);
        }}
        open={Boolean(selectedPost)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Post</DialogTitle>
            <DialogDescription>
              Atualize observacoes e avance o status para publicado.
            </DialogDescription>
          </DialogHeader>

          {selectedPost ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Titulo
                </p>
                <p className="text-sm text-[var(--foreground)]">{selectedPost.titulo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Canal
                </p>
                <p className="text-sm text-[var(--foreground)]">{selectedPost.canal}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Observacoes
                </label>
                <Input
                  onChange={(event) => setNotesDraft(event.target.value)}
                  value={notesDraft}
                />
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  onClick={() => {
                    deleteCalendarPost(selectedPost.id);
                    setSelectedPostId(null);
                  }}
                  variant="danger"
                >
                  Remover post
                </Button>
                <Button
                  onClick={() => {
                    updateCalendarPost(selectedPost.id, { observacoes: notesDraft });
                    setSelectedPostId(null);
                  }}
                  variant="outline"
                >
                  Salvar observacoes
                </Button>
                {selectedPost.ideaCardId ? (
                  <Button
                    onClick={() => {
                      markCardStatus(selectedPost.ideaCardId!, "Publicado");
                      setSelectedPostId(null);
                    }}
                  >
                    Marcar como Publicado
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
