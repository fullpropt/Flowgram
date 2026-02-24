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
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { IdeaCard } from "@/types/models";

interface BoardColumnsProps {
  cards: IdeaCard[];
  onOpenCard: (cardId: string) => void;
  onEditCard?: (cardId: string) => void;
}

export function BoardColumns({ cards, onOpenCard, onEditCard }: BoardColumnsProps) {
  const moveCardPillar = useAppStore((state) => state.moveCardPillar);
  const duplicateCard = useAppStore((state) => state.duplicateCard);
  const deleteCard = useAppStore((state) => state.deleteCard);
  const configuredGroups = useAppStore((state) => state.taxonomyConfig.grupos);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const groupOrder = useMemo(() => {
    const seen = new Set<string>();
    const values: string[] = [];

    [...configuredGroups, ...cards.map((card) => card.pilar).filter(Boolean) as string[]].forEach(
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

  const groupedCards = useMemo(() => {
    const groups = new Map<string, IdeaCard[]>();
    groupOrder.forEach((group) => groups.set(group, []));

    cards.forEach((card) => {
      if (!card.pilar) return;
      if (!groups.has(card.pilar)) groups.set(card.pilar, []);
      groups.get(card.pilar)!.push(card);
    });

    return groups;
  }, [cards, groupOrder]);

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const over = event.over;
    if (!over) return;

    const overData = over.data.current as { type?: string; group?: string } | undefined;
    const targetGroup = overData?.group;
    if (!targetGroup) return;

    moveCardPillar(activeId, targetGroup);
  }

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      sensors={sensors}
    >
      <div className={cn("grid grid-cols-1 gap-4", groupOrder.length > 0 && "xl:grid-cols-4")}>
        {groupOrder.map((group) => (
          <BoardColumn
            cardCount={groupedCards.get(group)?.length ?? 0}
            group={group}
            key={group}
          >
            <SortableContext
              items={(groupedCards.get(group) ?? []).map((card) => card.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {(groupedCards.get(group) ?? []).map((card) => (
                  <SortableCard
                    card={card}
                    key={card.id}
                    onDelete={() => deleteCard(card.id)}
                    onDuplicate={() => duplicateCard(card.id)}
                    onEdit={onEditCard ? () => onEditCard(card.id) : undefined}
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
  group,
  cardCount,
  children,
}: {
  group: string;
  cardCount: number;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${group}`,
    data: { type: "column", group },
  });

  return (
    <section
      className={cn(
        "panel-soft p-3",
        isOver && "border-[#a862dc] bg-[rgba(44,26,71,0.95)]",
      )}
      ref={setNodeRef}
    >
      <header className="mb-3 flex items-center justify-between border-b border-[var(--border)] pb-2">
        <h3 className="text-sm font-bold text-[var(--foreground)]">{group}</h3>
        <span className="rounded-full border border-[#5e3b83] bg-[rgba(22,14,39,0.85)] px-2 py-0.5 text-[11px] font-semibold text-[#d9c6f8]">
          {cardCount}
        </span>
      </header>
      {children}
    </section>
  );
}

function SortableCard({
  card,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  card: IdeaCard;
  onOpen: () => void;
  onEdit?: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: card.id,
      data: {
        type: "card",
        group: card.pilar,
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
      <CardItem
        card={card}
        onClick={onOpen}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onEdit={onEdit}
      />
    </div>
  );
}
