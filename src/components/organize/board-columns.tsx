"use client";

import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CardItem } from "@/components/cards/card-item";
import { PILARES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { IdeaCard, Pilar } from "@/types/models";

interface BoardColumnsProps {
  cards: IdeaCard[];
  onOpenCard: (cardId: string) => void;
}

export function BoardColumns({ cards, onOpenCard }: BoardColumnsProps) {
  const moveCardPillar = useAppStore((state) => state.moveCardPillar);
  const duplicateCard = useAppStore((state) => state.duplicateCard);
  const deleteCard = useAppStore((state) => state.deleteCard);

  const sensors = useSensors(useSensor(PointerSensor));

  const groupedCards = useMemo(() => {
    const groups: Record<Pilar, IdeaCard[]> = {
      Dor: [],
      Educação: [],
      Solução: [],
      Construção: [],
    };

    cards.forEach((card) => {
      if (!card.pilar) return;
      groups[card.pilar].push(card);
    });

    return groups;
  }, [cards]);

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const over = event.over;
    if (!over) return;

    const overData = over.data.current as { type?: string; pilar?: Pilar } | undefined;
    const targetPilar = overData?.pilar;
    if (!targetPilar) return;

    moveCardPillar(activeId, targetPilar);
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {PILARES.map((pilar) => (
          <BoardColumn key={pilar} pilar={pilar}>
            <SortableContext
              items={groupedCards[pilar].map((card) => card.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {groupedCards[pilar].map((card) => (
                  <SortableCard
                    card={card}
                    key={card.id}
                    onDelete={() => deleteCard(card.id)}
                    onDuplicate={() => duplicateCard(card.id)}
                    onOpen={() => onOpenCard(card.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </BoardColumn>
        ))}
      </div>
    </DndContext>
  );
}

function BoardColumn({
  pilar,
  children,
}: {
  pilar: Pilar;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${pilar}`,
    data: { type: "column", pilar },
  });

  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-white p-3",
        isOver && "border-[#8ca8ff] bg-[#f6f9ff]",
      )}
      ref={setNodeRef}
    >
      <header className="mb-3 border-b border-[var(--border)] pb-2">
        <h3 className="text-sm font-semibold">{pilar}</h3>
      </header>
      {children}
    </section>
  );
}

function SortableCard({
  card,
  onOpen,
  onDuplicate,
  onDelete,
}: {
  card: IdeaCard;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: {
        type: "card",
        pilar: card.pilar,
      },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-60")}
    >
      <CardItem card={card} onClick={onOpen} onDelete={onDelete} onDuplicate={onDuplicate} />
    </div>
  );
}
