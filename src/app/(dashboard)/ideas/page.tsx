"use client";

import { type ComponentType, useMemo, useState } from "react";
import { ChevronDown, FileText, Funnel, Search } from "lucide-react";
import { CardItem } from "@/components/cards/card-item";
import { BoardColumns } from "@/components/organize/board-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FORMATOS, PILARES, STATUSES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { Formato, IdeaStatus, Pilar } from "@/types/models";

export default function IdeasPage() {
  const cards = useAppStore((state) => state.cards);
  const hydrated = useAppStore((state) => state.hydrated);
  const openCardModal = useAppStore((state) => state.openCardModal);
  const duplicateCard = useAppStore((state) => state.duplicateCard);
  const deleteCard = useAppStore((state) => state.deleteCard);

  const [search, setSearch] = useState("");
  const [pilarFilter, setPilarFilter] = useState<Pilar | "">("");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "">("");
  const [formatFilter, setFormatFilter] = useState<Formato | "">("");
  const [showOrganizeBoard, setShowOrganizeBoard] = useState(false);

  const filteredCards = useMemo(() => {
    const term = search.toLowerCase().trim();
    return cards.filter((card) => {
      const matchesSearch =
        !term ||
        card.titulo.toLowerCase().includes(term) ||
        card.descricao?.toLowerCase().includes(term) ||
        card.tags.some((tag) => tag.toLowerCase().includes(term));

      const matchesPilar = !pilarFilter || card.pilar === pilarFilter;
      const matchesStatus = !statusFilter || card.status === statusFilter;
      const matchesFormat = !formatFilter || card.camadas.formato === formatFilter;

      return matchesSearch && matchesPilar && matchesStatus && matchesFormat;
    });
  }, [cards, formatFilter, pilarFilter, search, statusFilter]);

  const agendados = useMemo(
    () => cards.filter((card) => card.status === "Agendado").length,
    [cards],
  );

  const boardCards = useMemo(
    () => filteredCards.filter((card) => Boolean(card.pilar)),
    [filteredCards],
  );

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
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.7fr_1fr_1fr_1fr_auto]">
          <Input
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por titulo, descricao ou tags"
            value={search}
          />
          <FilterSelect
            onChange={(value) => setPilarFilter(value as Pilar | "")}
            options={PILARES}
            placeholder="Pilar"
            value={pilarFilter}
          />
          <FilterSelect
            onChange={(value) => setStatusFilter(value as IdeaStatus | "")}
            options={STATUSES}
            placeholder="Status"
            value={statusFilter}
          />
          <FilterSelect
            onChange={(value) => setFormatFilter(value as Formato | "")}
            options={FORMATOS}
            placeholder="Formato"
            value={formatFilter}
          />
          <Button
            onClick={() => {
              setSearch("");
              setPilarFilter("");
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

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredCards.map((card) => (
          <CardItem
            card={card}
            key={card.id}
            onClick={() => openCardModal(card.id)}
            onDelete={() => deleteCard(card.id)}
            onDuplicate={() => duplicateCard(card.id)}
          />
        ))}
      </section>

      <section className="panel-soft p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Organizacao integrada
            </p>
            <h3 className="text-base font-bold text-[var(--foreground)]">
              Organizar por pilares no Banco de Ideias
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Visualize e ajuste os grupos sem sair desta tela.
            </p>
          </div>

          <Button
            aria-expanded={showOrganizeBoard}
            onClick={() => setShowOrganizeBoard((current) => !current)}
            variant="outline"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${showOrganizeBoard ? "rotate-180" : ""}`}
            />
            {showOrganizeBoard ? "Recolher" : "Expandir"}
          </Button>
        </div>

        {showOrganizeBoard ? (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-[var(--muted)]">
              {boardCards.length} card(s) com pilar definido considerando os filtros atuais.
            </p>

            {hydrated ? (
              boardCards.length > 0 ? (
                <BoardColumns cards={boardCards} onOpenCard={(cardId) => openCardModal(cardId)} />
              ) : (
                <div className="panel p-5 text-sm text-[var(--muted)]">
                  Nenhum card com pilar definido para organizar com os filtros atuais.
                </div>
              )
            ) : (
              <div className="panel p-5 text-sm text-[var(--muted)]">Carregando board...</div>
            )}
          </div>
        ) : null}
      </section>

      {hydrated && filteredCards.length === 0 ? (
        <section className="panel-soft p-10 text-center text-sm text-[var(--muted)]">
          Nenhum card encontrado com os filtros atuais.
        </section>
      ) : null}
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <select
      className="h-10 rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
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
