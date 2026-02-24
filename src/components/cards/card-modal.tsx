"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FORMATOS, OBJETIVOS, PILARES, STATUSES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { Formato, IdeaCardInput, IdeaStatus, Objetivo, Pilar } from "@/types/models";

const emptyCard: IdeaCardInput = {
  titulo: "",
  descricao: "",
  pilar: undefined,
  camadas: {},
  status: "Ideia",
  tags: [],
};

export function CardModal() {
  const isOpen = useAppStore((state) => state.isCardModalOpen);
  const activeCardId = useAppStore((state) => state.activeCardId);
  const cards = useAppStore((state) => state.cards);
  const addCard = useAppStore((state) => state.addCard);
  const updateCard = useAppStore((state) => state.updateCard);
  const deleteCard = useAppStore((state) => state.deleteCard);
  const closeCardModal = useAppStore((state) => state.closeCardModal);

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId),
    [activeCardId, cards],
  );

  const [form, setForm] = useState<IdeaCardInput>(emptyCard);
  const [tagText, setTagText] = useState("");

  useEffect(() => {
    if (activeCard) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        titulo: activeCard.titulo,
        descricao: activeCard.descricao,
        pilar: activeCard.pilar,
        camadas: activeCard.camadas,
        status: activeCard.status,
        tags: activeCard.tags,
      });
      setTagText(activeCard.tags.join(", "));
      return;
    }

    setForm(emptyCard);
    setTagText("");
  }, [activeCard, isOpen]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload: IdeaCardInput = {
      ...form,
      titulo: form.titulo.trim(),
      tags: tagText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
    if (!payload.titulo) return;

    if (activeCard) {
      updateCard(activeCard.id, payload);
    } else {
      addCard(payload);
    }

    closeCardModal();
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) closeCardModal();
      }}
      open={isOpen}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{activeCard ? "Editar Card" : "Novo Card"}</DialogTitle>
          <DialogDescription>
            Preencha os dados do card para organizar e agendar seu conteudo.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Titulo
            </label>
            <Input
              onChange={(event) =>
                setForm((prev) => ({ ...prev, titulo: event.target.value }))
              }
              placeholder="Ex: 3 erros no direct que derrubam conversoes"
              required
              value={form.titulo}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Descricao
            </label>
            <Textarea
              onChange={(event) =>
                setForm((prev) => ({ ...prev, descricao: event.target.value }))
              }
              placeholder="Resumo do que este conteudo deve abordar..."
              value={form.descricao ?? ""}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <SelectField
              label="Pilar"
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  pilar: value ? (value as Pilar) : undefined,
                }))
              }
              options={PILARES}
              placeholder="Selecionar pilar"
              value={form.pilar}
            />
            <SelectField
              label="Status"
              onChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as IdeaStatus }))
              }
              options={STATUSES}
              value={form.status ?? "Ideia"}
            />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-slate-50/60 p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Camadas
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-slate-500">Macro Tema</label>
                <Input
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      camadas: {
                        ...prev.camadas,
                        macroTema: event.target.value,
                      },
                    }))
                  }
                  value={form.camadas?.macroTema ?? ""}
                />
              </div>
              <SelectField
                label="Formato"
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    camadas: {
                      ...prev.camadas,
                      formato: value ? (value as Formato) : undefined,
                    },
                  }))
                }
                options={FORMATOS}
                placeholder="Selecionar formato"
                value={form.camadas?.formato}
              />
              <SelectField
                label="Objetivo"
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    camadas: {
                      ...prev.camadas,
                      objetivo: value ? (value as Objetivo) : undefined,
                    },
                  }))
                }
                options={OBJETIVOS}
                placeholder="Selecionar objetivo"
                value={form.camadas?.objetivo}
              />
              <div className="space-y-2">
                <label className="text-xs text-slate-500">Hook</label>
                <Input
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      camadas: { ...prev.camadas, hook: event.target.value },
                    }))
                  }
                  value={form.camadas?.hook ?? ""}
                />
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-xs text-slate-500">CTA</label>
              <Input
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    camadas: { ...prev.camadas, cta: event.target.value },
                  }))
                }
                value={form.camadas?.cta ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Tags (separadas por virgula)
            </label>
            <Input
              onChange={(event) => setTagText(event.target.value)}
              placeholder="instagram, vendas, reels"
              value={tagText}
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            {activeCard ? (
              <Button
                onClick={() => {
                  deleteCard(activeCard.id);
                  closeCardModal();
                }}
                type="button"
                variant="danger"
              >
                Excluir
              </Button>
            ) : null}
            <Button
              onClick={() => closeCardModal()}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button type="submit">
              {activeCard ? "Salvar alteracoes" : "Criar card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface SelectFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs text-slate-500">{label}</label>
      <select
        className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none focus:border-[#bfd0ff] focus:ring-2 focus:ring-[#dbe7ff]"
        onChange={(event) => onChange(event.target.value)}
        value={value ?? ""}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
