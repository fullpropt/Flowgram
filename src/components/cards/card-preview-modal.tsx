"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanalSymbol } from "@/components/ui/canal-symbol";
import { FormatoSymbol } from "@/components/ui/formato-symbol";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { objetivoLabel, pilarLabel, statusLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Canal, IdeaCard } from "@/types/models";

const pilarTone: Partial<Record<NonNullable<IdeaCard["pilar"]>, string>> = {
  Dor: "from-[#ff6b8f] to-[#ff925a]",
  Educacao: "from-[#59c9ff] to-[#52f1ff]",
  Solucao: "from-[#9dff87] to-[#56f0ad]",
  Construcao: "from-[#f857b2] to-[#a83cff]",
};

interface CardPreviewModalProps {
  card: IdeaCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onQuickRename?: (cardId: string, nextTitle: string) => void;
  canal?: Canal;
  extraActions?: React.ReactNode;
}

export function CardPreviewModal({
  card,
  open,
  onOpenChange,
  onEdit,
  onQuickRename,
  canal,
  extraActions,
}: CardPreviewModalProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsEditingTitle(false);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitleDraft(card?.titulo ?? "");
  }, [card?.id, card?.titulo, open]);

  useEffect(() => {
    if (!isEditingTitle) return;
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, [isEditingTitle]);

  function commitTitleEdit() {
    if (!card) return;

    const nextTitle = titleDraft.trim();
    if (!nextTitle) {
      setTitleDraft(card.titulo);
      setIsEditingTitle(false);
      return;
    }

    if (nextTitle !== card.titulo) {
      onQuickRename?.(card.id, nextTitle);
    }

    setIsEditingTitle(false);
  }

  function cancelTitleEdit() {
    if (!card) return;
    setTitleDraft(card.titulo);
    setIsEditingTitle(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl overflow-hidden p-0">
        {card ? (
          <div className="relative">
            <div
              className={cn(
                "h-1 w-full bg-gradient-to-r",
                card.pilar ? pilarTone[card.pilar] : "from-[#5b477f] to-[#392953]",
              )}
            />

            <div className="space-y-5 p-5 md:p-6">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-[#6b448f] bg-[rgba(248,87,178,0.14)] text-[#ffd2f4]">
                    {statusLabel[card.status]}
                  </Badge>
                  {canal ? (
                    <span title={`Canal: ${canal}`}>
                      <Badge className="border-[#4d356f] bg-[rgba(31,19,51,0.82)] text-[#e7d7ff]">
                        <CanalSymbol canal={canal} />
                      </Badge>
                    </span>
                  ) : null}
                  {card.pilar ? (
                    <Badge className="border-[#4c356d] bg-[rgba(31,19,51,0.82)] text-[#e7d7ff]">
                      Pilar: {pilarLabel[card.pilar]}
                    </Badge>
                  ) : null}
                </div>
                {isEditingTitle ? (
                  <div className="pt-1">
                    <Input
                      className="h-11 text-lg font-bold"
                      onBlur={commitTitleEdit}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          commitTitleEdit();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelTitleEdit();
                        }
                      }}
                      ref={titleInputRef}
                      value={titleDraft}
                    />
                  </div>
                ) : (
                  <DialogTitle asChild>
                    <button
                      className="cursor-text text-left text-xl leading-tight font-semibold text-[var(--foreground)] underline-offset-4 hover:underline"
                      onClick={() => setIsEditingTitle(true)}
                      title="Clique para editar o titulo rapidamente"
                      type="button"
                    >
                      {card.titulo}
                    </button>
                  </DialogTitle>
                )}
              </DialogHeader>

              {card.descricao ? (
                <section className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                    Descricao
                  </p>
                  <div className="rounded-xl border border-[var(--border)] bg-[rgba(18,11,33,0.78)] p-3 text-sm leading-relaxed text-[#ddd0f5]">
                    {card.descricao}
                  </div>
                </section>
              ) : null}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <InfoBlock label="Hook" value={card.camadas.hook} />
                <InfoBlock label="CTA" value={card.camadas.cta} />
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[rgba(17,10,31,0.78)] p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Resumo
                </p>

                <div className="grid gap-2 text-sm text-[#dccccf]">
                  <RowValue
                    label="Pilar"
                    value={card.pilar ? pilarLabel[card.pilar] : "Nao definido"}
                  />
                  <RowValue
                    label="Macrotema"
                    value={card.camadas.macroTema ?? "Nao definido"}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
                {card.camadas.formato ? (
                  <span title={`Formato: ${card.camadas.formato}`}>
                    <Badge>
                      <FormatoSymbol formato={card.camadas.formato} />
                    </Badge>
                  </span>
                ) : null}
                {card.camadas.objetivo ? (
                  <Badge>{objetivoLabel[card.camadas.objetivo]}</Badge>
                ) : null}
                {card.camadas.macroTema ? (
                  <Badge className="max-w-full truncate">{card.camadas.macroTema}</Badge>
                ) : null}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                {extraActions}
                <Button onClick={() => onOpenChange(false)} variant="outline">
                  Fechar
                </Button>
                {onEdit ? (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      onEdit();
                    }}
                  >
                    Editar card
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[rgba(18,11,33,0.78)] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[var(--foreground)]">
        {value?.trim() ? value : "Nao definido"}
      </p>
    </div>
  );
}

function RowValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
        {label}
      </span>
      <span className="text-sm text-[var(--foreground)]">{value}</span>
    </div>
  );
}
