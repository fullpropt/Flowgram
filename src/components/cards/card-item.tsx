"use client";

import { useState } from "react";
import { ChevronDown, Copy, Pencil, Trash2 } from "lucide-react";
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
  collapsible?: boolean;
  defaultExpanded?: boolean;
  draggable?: boolean;
  onClick?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onDragStart?: () => void;
}

const pilarTone: Partial<Record<NonNullable<IdeaCard["pilar"]>, string>> = {
  Dor: "from-[#ff6b8f] to-[#ff925a]",
  Educacao: "from-[#59c9ff] to-[#52f1ff]",
  Solucao: "from-[#9dff87] to-[#56f0ad]",
  Construcao: "from-[#f857b2] to-[#a83cff]",
};

export function CardItem({
  card,
  className,
  compact = false,
  showActions = true,
  collapsible = true,
  defaultExpanded = false,
  draggable = false,
  onClick,
  onDuplicate,
  onDelete,
  onDragStart,
}: CardItemProps) {
  const canCollapse = collapsible && !compact;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

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
          card.pilar ? pilarTone[card.pilar] : "from-[#5b477f] to-[#392953]",
        )}
      />

      <div className="mb-3 mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-sm font-bold text-[var(--foreground)]">{card.titulo}</h3>
          {card.descricao && !compact ? (
            <p
              className={cn(
                "mt-1 text-xs leading-relaxed text-[var(--muted)]",
                isExpanded ? "line-clamp-4" : "line-clamp-2",
              )}
            >
              {card.descricao}
            </p>
          ) : null}
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

          {showActions ? (
            <div className="flex items-center gap-1 opacity-80 transition group-hover:opacity-100">
              <Button onClick={onDuplicate} size="icon" title="Duplicar" variant="ghost">
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button onClick={onDelete} size="icon" title="Excluir" variant="ghost">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </Button>
            </div>
          ) : (
            <Pencil className="mt-0.5 h-4 w-4 text-[#8063aa]" />
          )}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {card.pilar ? <Badge>{pilarLabel[card.pilar]}</Badge> : null}
        <Badge className="border-[#6b448f] bg-[rgba(248,87,178,0.14)] text-[#ffd2f4]">
          {statusLabel[card.status]}
        </Badge>
      </div>

      <div
        className={cn(
          "space-y-2 text-xs text-[#ccbde7]",
          canCollapse && !isExpanded && "hidden",
        )}
      >
        {card.camadas.macroTema ? (
          <p className="line-clamp-1">
            <span className="font-semibold text-[#f3e9ff]">Macro tema:</span>{" "}
            {card.camadas.macroTema}
          </p>
        ) : null}
        {card.camadas.formato ? (
          <p>
            <span className="font-semibold text-[#f3e9ff]">Formato:</span>{" "}
            {formatoLabel[card.camadas.formato]}
          </p>
        ) : null}
        {card.camadas.objetivo ? (
          <p>
            <span className="font-semibold text-[#f3e9ff]">Objetivo:</span>{" "}
            {objetivoLabel[card.camadas.objetivo]}
          </p>
        ) : null}
      </div>

      {canCollapse && !isExpanded ? (
        <p className="mt-1 text-[11px] font-medium text-[#bca6de]">Toque na seta para ver detalhes</p>
      ) : null}
    </article>
  );
}
