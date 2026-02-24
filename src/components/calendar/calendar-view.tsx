"use client";

import { useMemo, useState } from "react";
import { format, getDay, parse, startOfWeek } from "date-fns";
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

export function CalendarView() {
  const cards = useAppStore((state) => state.cards);
  const calendarPosts = useAppStore((state) => state.calendarPosts);
  const addCalendarPost = useAppStore((state) => state.addCalendarPost);
  const updateCalendarPost = useAppStore((state) => state.updateCalendarPost);
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
        end: post.dataFim ? new Date(post.dataFim) : new Date(post.dataInicio),
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
    addCalendarPost({
      titulo,
      dataInicio: slot.start.toISOString(),
      dataFim: slot.end.toISOString(),
      canal: canalFromPrompt(canalInput),
    });
  }

  function handleDropFromOutside({ start, end }: DragFromOutsideItemArgs) {
    if (!draggedCard) return;

    addCalendarPost({
      ideaCardId: draggedCard.id,
      titulo: draggedCard.titulo,
      dataInicio: new Date(start).toISOString(),
      dataFim: new Date(end).toISOString(),
      canal:
        draggedCard.camadas.formato === "Reels"
          ? "Reels"
          : draggedCard.camadas.formato === "Story"
            ? "Story"
            : "Feed",
    });
    setDraggedCardId(null);
  }

  function handleMoveEvent({ event, start, end }: EventInteractionArgs<CalendarEvent>) {
    updateCalendarPost(event.id, {
      dataInicio: new Date(start).toISOString(),
      dataFim: new Date(end).toISOString(),
    });
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_1fr]">
      <section className="panel h-fit p-4">
        <h2 className="mb-1 text-sm font-bold text-slate-900">Cards nao agendados</h2>
        <p className="mb-4 text-xs leading-relaxed text-slate-500">
          Arraste um card para uma data no calendario.
        </p>

        <div className="space-y-3">
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
            <p className="rounded-xl border border-[var(--border)] bg-slate-50 px-3 py-4 text-sm text-slate-500">
              Todos os cards ja estao agendados.
            </p>
          ) : null}
        </div>
      </section>

      <section className="min-h-[760px]">
        <DndProvider backend={HTML5Backend}>
          <DragAndDropCalendar
            culture="pt-BR"
            dragFromOutsideItem={() => ({
              id: draggedCard?.id ?? "outside-placeholder",
              title: draggedCard?.titulo ?? "Novo post",
              start: new Date(),
              end: new Date(),
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
            onEventResize={handleMoveEvent}
            onSelectEvent={(event) => {
              setSelectedPostId(event.id);
              setNotesDraft(event.resource.observacoes ?? "");
            }}
            onSelectSlot={handleCreateFromSlot}
            onView={setCurrentView}
            popup
            resizable
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
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Titulo
                </p>
                <p className="text-sm">{selectedPost.titulo}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Canal
                </p>
                <p className="text-sm">{selectedPost.canal}</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
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
