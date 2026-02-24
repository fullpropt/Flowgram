"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { FORMATOS, STATUSES } from "@/lib/constants";
import { useAppStore } from "@/store/app-store";
import { Formato, IdeaCardInput, IdeaStatus } from "@/types/models";

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
  const taxonomyConfig = useAppStore((state) => state.taxonomyConfig);
  const addCard = useAppStore((state) => state.addCard);
  const updateCard = useAppStore((state) => state.updateCard);
  const deleteCard = useAppStore((state) => state.deleteCard);
  const closeCardModal = useAppStore((state) => state.closeCardModal);

  const activeCard = useMemo(
    () => cards.find((card) => card.id === activeCardId),
    [activeCardId, cards],
  );

  const [form, setForm] = useState<IdeaCardInput>(emptyCard);
  const [selectedTagToAdd, setSelectedTagToAdd] = useState("");

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
      setSelectedTagToAdd("");
      return;
    }

    setForm(emptyCard);
    setSelectedTagToAdd("");
  }, [activeCard, isOpen]);

  const groupOptions = mergeUniqueStrings(taxonomyConfig.grupos, form.pilar ? [form.pilar] : []);
  const objectiveOptions = mergeUniqueStrings(
    taxonomyConfig.objetivos,
    form.camadas?.objetivo ? [form.camadas.objetivo] : [],
  );
  const tagOptions = mergeUniqueStrings(taxonomyConfig.tags, form.tags ?? []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const payload: IdeaCardInput = {
      ...form,
      titulo: form.titulo.trim(),
      tags: (form.tags ?? []).map((tag) => tag.trim()).filter(Boolean),
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

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
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
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
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
              label="Grupo"
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  pilar: value || undefined,
                }))
              }
              options={groupOptions}
              placeholder="Selecionar grupo"
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

          <div className="panel-soft p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Camadas
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Macro Tema</label>
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
                      objetivo: value || undefined,
                    },
                  }))
                }
                options={objectiveOptions}
                placeholder="Selecionar objetivo"
                value={form.camadas?.objetivo}
              />
              <div className="space-y-2">
                <label className="text-xs text-[var(--muted)]">Hook</label>
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
              <label className="text-xs text-[var(--muted)]">CTA</label>
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
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Tags
            </label>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <select
                className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
                onChange={(event) => setSelectedTagToAdd(event.target.value)}
                value={selectedTagToAdd}
              >
                <option value="">
                  {tagOptions.length > 0 ? "Selecionar tag" : "Cadastre tags em Configuracoes"}
                </option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <Button
                disabled={!selectedTagToAdd}
                onClick={() => {
                  if (!selectedTagToAdd) return;
                  setForm((prev) => ({
                    ...prev,
                    tags: mergeUniqueStrings(prev.tags ?? [], [selectedTagToAdd]),
                  }));
                  setSelectedTagToAdd("");
                }}
                type="button"
                variant="outline"
              >
                Adicionar tag
              </Button>
            </div>

            {(form.tags ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {(form.tags ?? []).map((tag) => (
                  <Badge className="gap-1 pr-1" key={tag}>
                    <span>{tag}</span>
                    <button
                      className="inline-flex h-4 w-4 items-center justify-center rounded transition hover:bg-[rgba(255,255,255,0.12)]"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          tags: (prev.tags ?? []).filter((currentTag) => currentTag !== tag),
                        }))
                      }
                      title={`Remover tag ${tag}`}
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                Nenhuma tag selecionada.
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
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

function mergeUniqueStrings(primary: string[], extra: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  [...primary, ...extra].forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLocaleLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });

  return result;
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
      <label className="text-xs text-[var(--muted)]">{label}</label>
      <select
        className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]"
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
