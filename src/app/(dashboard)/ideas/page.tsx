"use client";

import { useMemo, useState } from "react";
import { CardItem } from "@/components/cards/card-item";
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

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
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
            Limpar filtros
          </Button>
        </div>
      </section>

      {!hydrated ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-sm text-slate-500">
          Carregando cards...
        </div>
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

      {hydrated && filteredCards.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-slate-500">
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
      className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none focus:border-[#bfd0ff] focus:ring-2 focus:ring-[#dbe7ff]"
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
