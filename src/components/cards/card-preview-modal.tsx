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
import { getGroupLabel, getGroupTone, getObjetivoLabel, statusLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Canal, IdeaCard } from "@/types/models";

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
                getGroupTone(card.pilar),
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
                      Grupo: {getGroupLabel(card.pilar)}
                    </Badge>
                  ) : null}
                </div>
                {isEditingTitle ? (
                  <div className="rounded-xl border border-[#6b448f] bg-[rgba(23,14,40,0.78)] p-2 shadow-[0_0_0_1px_rgba(248,87,178,0.08)_inset]">
                    <Input
                      className="h-11 border-[#7a4fb1] bg-[rgba(15,10,29,0.9)] text-lg font-bold"
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
                      className="w-full rounded-xl border border-[#5d3b86] bg-[linear-gradient(145deg,rgba(248,87,178,0.08),rgba(168,60,255,0.08),rgba(255,154,60,0.06))] px-3 py-2 text-left shadow-[0_10px_24px_rgba(5,3,10,0.35)] transition hover:border-[#8a54bc] hover:bg-[linear-gradient(145deg,rgba(248,87,178,0.12),rgba(168,60,255,0.1),rgba(255,154,60,0.08))]"
                      onClick={() => setIsEditingTitle(true)}
                      title="Clique para editar o titulo rapidamente"
                      type="button"
                    >
                      <span className="bg-[linear-gradient(135deg,var(--glow-pink),var(--glow-purple),var(--glow-orange))] bg-clip-text text-xl leading-tight font-semibold text-transparent">
                        {card.titulo}
                      </span>
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
                    label="Grupo"
                    value={card.pilar ? getGroupLabel(card.pilar) : "Nao definido"}
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
                  <Badge>{getObjetivoLabel(card.camadas.objetivo)}</Badge>
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
