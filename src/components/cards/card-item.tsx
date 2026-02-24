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
        "rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[#c8d7ff] hover:shadow-md",
        className,
      )}
      draggable={draggable}
      onClick={onClick}
      onDragStart={onDragStart}
      role="button"
      tabIndex={0}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900">
            {card.titulo}
          </h3>
          {card.descricao && !compact ? (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">
              {card.descricao}
            </p>
          ) : null}
        </div>
        {showActions ? (
          <div
            className="flex items-center gap-1"
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
          <Pencil className="mt-0.5 h-4 w-4 text-slate-400" />
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {card.pilar ? <Badge>{pilarLabel[card.pilar]}</Badge> : null}
        <Badge className="bg-[#f0f9ff] text-[#0369a1]">
          {statusLabel[card.status]}
        </Badge>
      </div>

      <div className="space-y-1.5 text-xs text-slate-600">
        {card.camadas.macroTema ? (
          <p>
            <span className="font-semibold">Macro:</span> {card.camadas.macroTema}
          </p>
        ) : null}
        {card.camadas.formato ? (
          <p>
            <span className="font-semibold">Formato:</span>{" "}
            {formatoLabel[card.camadas.formato]}
          </p>
        ) : null}
        {card.camadas.objetivo ? (
          <p>
            <span className="font-semibold">Objetivo:</span>{" "}
            {objetivoLabel[card.camadas.objetivo]}
          </p>
        ) : null}
      </div>
    </article>
  );
}
