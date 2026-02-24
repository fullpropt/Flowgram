"use client";

import { useState } from "react";
import { ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormatoSymbol } from "@/components/ui/formato-symbol";
import { getGroupTone, getObjetivoLabel, statusLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { IdeaCard } from "@/types/models";

interface CardItemProps {
  card: IdeaCard;
  className?: string;
  compact?: boolean;
  showActions?: boolean;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDragStart?: () => void;
}

export function CardItem({
  card,
  className,
  compact = false,
  showActions = true,
  collapsible = true,
  defaultExpanded = false,
  draggable = false,
  onClick,
  onEdit,
  onDuplicate,
  onDelete,
  onDragStart,
}: CardItemProps) {
  const canCollapse = collapsible && !compact;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const showExpandedDetails = !canCollapse || isExpanded;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(19,12,36,0.82)] p-4 shadow-[0_10px_24px_rgba(5,3,10,0.5)] transition duration-200 hover:-translate-y-[2px] hover:border-[#6a3d93] hover:shadow-[0_16px_34px_rgba(5,3,10,0.68)]",
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
          getGroupTone(card.pilar),
        )}
      />

      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-sm font-bold text-[var(--foreground)]">{card.titulo}</h3>
        </div>
        <div className="flex items-center gap-1" onClick={(event) => event.stopPropagation()}>
          {canCollapse ? (
            <Button
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((current) => !current)}
              size="icon"
              title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
              variant="ghost"
            >
              <ChevronDown
                className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")}
              />
            </Button>
          ) : null}

          {onEdit ? (
            <Button onClick={onEdit} size="icon" title="Editar" variant="ghost">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          ) : null}

          {showActions ? (
            <div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">
              <Button onClick={onDuplicate} size="icon" title="Duplicar" variant="ghost">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={onDelete} size="icon" title="Excluir" variant="ghost">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
              </div>
          ) : null}
        </div>
      </div>

      {!compact ? (
        card.descricao && showExpandedDetails ? (
          <p
            className={cn(
              "mb-3 mt-2 text-xs leading-relaxed text-[var(--muted)]",
              !canCollapse && "line-clamp-2",
            )}
          >
            {card.descricao}
          </p>
        ) : (
          <div className="mb-3" />
        )
      ) : null}

      <div className={cn("flex flex-wrap gap-2", showExpandedDetails && "mb-3", !showExpandedDetails && "mb-0")}>
        <Badge className="border-[#6b448f] bg-[rgba(248,87,178,0.14)] text-[#ffd2f4]">
          {statusLabel[card.status]}
        </Badge>
        {card.camadas.formato ? (
          <span title={`Formato: ${card.camadas.formato}`}>
            <Badge className="border-[#4e3a73] bg-[rgba(88,58,133,0.14)] text-[#d9c8fb]">
              <FormatoSymbol formato={card.camadas.formato} />
            </Badge>
          </span>
        ) : null}
      </div>

      <div
        className={cn(
          "space-y-2 text-xs text-[#ccbde7]",
          !showExpandedDetails && "hidden",
        )}
      >
        {card.camadas.macroTema ? (
          <p className="line-clamp-1">
            <span className="font-semibold text-[#f3e9ff]">Macro tema:</span>{" "}
            {card.camadas.macroTema}
          </p>
        ) : null}
        {card.camadas.objetivo ? (
          <p>
            <span className="font-semibold text-[#f3e9ff]">Objetivo:</span>{" "}
            {getObjetivoLabel(card.camadas.objetivo)}
          </p>
        ) : null}
      </div>
    </article>
  );
}
