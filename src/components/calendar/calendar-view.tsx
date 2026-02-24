"use client";

import { useMemo, useState } from "react";
import { addMinutes, format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, dateFnsLocalizer, type SlotInfo, type View } from "react-big-calendar";
import withDragAndDrop, {
  type DragFromOutsideItemArgs,
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
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

export function CalendarView() {
  const cards = useAppStore((state) => state.cards);
  const calendarPosts = useAppStore((state) => state.calendarPosts);
  const addCalendarPost = useAppStore((state) => state.addCalendarPost);
  const updateCalendarPost = useAppStore((state) => state.updateCalendarPost);
  const deleteCalendarPost = useAppStore((state) => state.deleteCalendarPost);
  const markCardStatus = useAppStore((state) => state.markCardStatus);

  const [currentView, setCurrentView] = useState<View>("month");
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

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
    return cards.filter((card) => !scheduledCardIds.has(card.id));
  }, [calendarPosts, cards]);

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
        <h2 className="mb-1 text-sm font-bold text-[var(--foreground)]">Cards nao agendados</h2>
        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)]">
          Arraste um card para uma data no calendario.
        </p>

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
              Todos os cards ja estao agendados.
            </p>
          ) : null}
        </div>
      </section>

      <section className="min-h-[760px] min-w-0">
        <DndProvider backend={HTML5Backend}>
          <DragAndDropCalendar
            allDayAccessor={() => false}
            culture="pt-BR"
            dragFromOutsideItem={() => ({
              id: draggedCard?.id ?? "outside-placeholder",
              title: draggedCard?.titulo ?? "Novo post",
              start: new Date(),
              end: addMinutes(new Date(), 30),
              allDay: false,
              resource: {} as CalendarPost,
            })}
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
            onEventDrop={handleMoveEvent}
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
