"use client";

import { type ComponentType, useMemo, useState } from "react";
import { FileText, Funnel, Search } from "lucide-react";
import { CardItem } from "@/components/cards/card-item";
import { CardPreviewModal } from "@/components/cards/card-preview-modal";
import { BoardColumns } from "@/components/organize/board-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORMATOS, STATUSES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { Formato, IdeaStatus } from "@/types/models";

export default function IdeasPage() {
  const cards = useAppStore((state) => state.cards);
  const hydrated = useAppStore((state) => state.hydrated);
  const openCardModal = useAppStore((state) => state.openCardModal);
  const updateCard = useAppStore((state) => state.updateCard);
  const duplicateCard = useAppStore((state) => state.duplicateCard);
  const deleteCard = useAppStore((state) => state.deleteCard);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "">("");
  const [formatFilter, setFormatFilter] = useState<Formato | "">("");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);

  const filteredCards = useMemo(() => {
    const term = search.toLowerCase().trim();
    return cards.filter((card) => {
      const matchesSearch =
        !term ||
        card.titulo.toLowerCase().includes(term) ||
        card.descricao?.toLowerCase().includes(term) ||
        card.tags.some((tag) => tag.toLowerCase().includes(term));

      const matchesStatus = !statusFilter || card.status === statusFilter;
      const matchesFormat = !formatFilter || card.camadas.formato === formatFilter;

      return matchesSearch && matchesStatus && matchesFormat;
    });
  }, [cards, formatFilter, search, statusFilter]);

  const agendados = useMemo(
    () => cards.filter((card) => card.status === "Agendado").length,
    [cards],
  );

  const groupedCards = useMemo(
    () => filteredCards.filter((card) => Boolean(card.pilar)),
    [filteredCards],
  );
  const cardsWithoutPilar = useMemo(
    () => filteredCards.filter((card) => !card.pilar),
    [filteredCards],
  );
  const previewCard = useMemo(
    () => cards.find((card) => card.id === previewCardId) ?? null,
    [cards, previewCardId],
  );

  function handleDeleteCard(cardId: string) {
    if (previewCardId === cardId) setPreviewCardId(null);
    deleteCard(cardId);
  }

  return (
    <div className="space-y-4">
      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Visao geral
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">Cards de Conteudo</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Filtre, edite e organize suas ideias de forma rapida.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <StatChip icon={FileText} label="Total" value={String(cards.length)} />
            <StatChip icon={Funnel} label="Filtrados" value={String(filteredCards.length)} />
            <StatChip icon={Search} label="Agendados" value={String(agendados)} />
          </div>
        </div>
      </section>

      <section className="panel-soft p-4">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.9fr_1fr_1fr_auto] xl:items-end">
          <Input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titulo, descricao ou tags"
            value={search}
          />
          <FilterSelect
            onChange={(value) => setStatusFilter(value as IdeaStatus | "")}
            options={STATUSES}
            label="Status"
            value={statusFilter}
          />
          <FilterSelect
            onChange={(value) => setFormatFilter(value as Formato | "")}
            options={FORMATOS}
            label="Formato"
            value={formatFilter}
          />
          <Button
            onClick={() => {
              setSearch("");
              setStatusFilter("");
              setFormatFilter("");
            }}
            variant="outline"
          >
            Limpar
          </Button>
        </div>
      </section>

      {!hydrated ? (
        <div className="panel p-5 text-sm text-[var(--muted)]">Carregando cards...</div>
      ) : null}

      {hydrated ? (
        groupedCards.length > 0 ? (
          <BoardColumns
            cards={groupedCards}
            onEditCard={(cardId) => openCardModal(cardId)}
            onOpenCard={(cardId) => setPreviewCardId(cardId)}
          />
        ) : null
      ) : null}

      {hydrated && cardsWithoutPilar.length > 0 ? (
        <section className="panel-soft p-4">
          <div className="mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Sem grupo
            </p>
            <p className="text-sm text-[var(--muted)]">
              Cards sem grupo definido aparecem aqui.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cardsWithoutPilar.map((card) => (
              <CardItem
                card={card}
                key={card.id}
                onClick={() => setPreviewCardId(card.id)}
                onDelete={() => handleDeleteCard(card.id)}
                onDuplicate={() => duplicateCard(card.id)}
                onEdit={() => openCardModal(card.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {hydrated && filteredCards.length === 0 ? (
        <section className="panel-soft p-10 text-center text-sm text-[var(--muted)]">
          Nenhum card encontrado com os filtros atuais.
        </section>
      ) : null}

      <CardPreviewModal
        card={previewCard}
        onEdit={previewCard ? () => openCardModal(previewCard.id) : undefined}
        onQuickRename={(cardId, nextTitle) => updateCard(cardId, { titulo: nextTitle })}
        onOpenChange={(open) => {
          if (!open) setPreviewCardId(null);
        }}
        open={Boolean(previewCard)}
      />
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
        {label}
      </span>
      <select
        aria-label={label}
        className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 py-2">
      <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="text-base font-bold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

