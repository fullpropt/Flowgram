"use client";

import { Copy, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatoLabel, objetivoLabel, pilarLabel, statusLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IdeaCard } from "@/types/models";

interface CardItemProps {
  card: IdeaCard;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDragStart?: () => void;
}

const pilarTone: Partial<Record<NonNullable<IdeaCard["pilar"]>, string>> = {
  Dor: "from-rose-200/70 to-rose-100/50",
  Educacao: "from-sky-200/70 to-sky-100/50",
  Solucao: "from-emerald-200/70 to-emerald-100/50",
  Construcao: "from-violet-200/70 to-violet-100/50",
};

export function CardItem({
  card,
  className,
  compact = false,
  showActions = true,
  draggable = false,
  onClick,
  onDuplicate,
  onDelete,
  onDragStart,
}: CardItemProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-[2px] hover:border-[#c9d8ff] hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)]",
        className,
      )}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      role="button"
      tabIndex={0}
    >
      <div
        className={cn(
          "absolute left-0 top-0 h-1 w-full bg-gradient-to-r",
          card.pilar ? pilarTone[card.pilar] : "from-slate-200 to-slate-100",
        )}
      />

      <div className="mb-3 mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{card.titulo}</h3>
          {card.descricao && !compact ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
              {card.descricao}
            </p>
          ) : null}
        </div>
        {showActions ? (
          <div
            className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100"
            onClick={(event) => event.stopPropagation()}
          >
            <Button onClick={onDuplicate} size="icon" title="Duplicar" variant="ghost">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={onDelete} size="icon" title="Excluir" variant="ghost">
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </Button>
          </div>
        ) : (
          <Pencil className="mt-0.5 h-4 w-4 text-slate-300" />
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {card.pilar ? <Badge>{pilarLabel[card.pilar]}</Badge> : null}
        <Badge className="border-[#cfe3ff] bg-[#f4f9ff] text-[#25539f]">
          {statusLabel[card.status]}
        </Badge>
      </div>

      <div className="space-y-2 text-xs text-slate-600">
        {card.camadas.macroTema ? (
          <p className="line-clamp-1">
            <span className="font-semibold text-slate-700">Macro tema:</span>{" "}
            {card.camadas.macroTema}
          </p>
        ) : null}
        {card.camadas.formato ? (
          <p>
            <span className="font-semibold text-slate-700">Formato:</span>{" "}
            {formatoLabel[card.camadas.formato]}
          </p>
        ) : null}
        {card.camadas.objetivo ? (
          <p>
            <span className="font-semibold text-slate-700">Objetivo:</span>{" "}
            {objetivoLabel[card.camadas.objetivo]}
          </p>
        ) : null}
      </div>
    </article>
  );
}
