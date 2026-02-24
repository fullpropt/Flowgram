"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { WorkspaceTaxonomyConfig } from "@/types/models";

type TaxonomyKey = keyof WorkspaceTaxonomyConfig;

export default function SettingsPage() {
  const taxonomyConfig = useAppStore((state) => state.taxonomyConfig);
  const setTaxonomyList = useAppStore((state) => state.setTaxonomyList);

  const sections = useMemo(
    () =>
      [
        {
          key: "grupos",
          title: "Grupos",
          subtitle: "Categorias usadas para organizar os cards no Banco de Ideias e no Calendario.",
          placeholder: "Ex: Bastidores",
        },
        {
          key: "objetivos",
          title: "Objetivos",
          subtitle: "Objetivos disponiveis para marcar a intencao de cada conteudo.",
          placeholder: "Ex: Conversao",
        },
        {
          key: "tags",
          title: "Tags",
          subtitle: "Tags exibidas como lista suspensa no modal de criar/editar card.",
          placeholder: "Ex: Instagram",
        },
      ] as const satisfies Array<{
        key: TaxonomyKey;
        title: string;
        subtitle: string;
        placeholder: string;
      }>,
    [],
  );

  return (
    <div className="space-y-4">
      <section className="panel p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
          Workspace
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
          Configuracoes de Conteudo
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Personalize grupos, objetivos e tags usados na criacao e organizacao dos cards.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        {sections.map((section) => (
          <EditableListPanel
            items={taxonomyConfig[section.key]}
            key={section.key}
            onChange={(values) => setTaxonomyList(section.key, values)}
            placeholder={section.placeholder}
            subtitle={section.subtitle}
            title={section.title}
          />
        ))}
      </div>
    </div>
  );
}

function EditableListPanel({
  title,
  subtitle,
  placeholder,
  items,
  onChange,
}: {
  title: string;
  subtitle: string;
  placeholder: string;
  items: string[];
  onChange: (values: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");

  function normalize(values: string[]) {
    const seen = new Set<string>();
    const next: string[] = [];

    values.forEach((value) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      const key = trimmed.toLocaleLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      next.push(trimmed);
    });

    return next;
  }

  function addItem() {
    const value = draft.trim();
    if (!value) return;
    onChange(normalize([...items, value]));
    setDraft("");
  }

  function saveEdit() {
    if (editingIndex === null) return;

    const nextItems = items.map((item, index) => (index === editingIndex ? editingValue : item));
    onChange(normalize(nextItems));
    setEditingIndex(null);
    setEditingValue("");
  }

  function removeItem(indexToRemove: number) {
    onChange(items.filter((_, index) => index !== indexToRemove));
    if (editingIndex === indexToRemove) {
      setEditingIndex(null);
      setEditingValue("");
    }
  }

  return (
    <section className="panel-soft flex min-h-[320px] flex-col p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
          {title}
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p>
      </div>

      <div className="mb-3 flex gap-2">
        <Input
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
          placeholder={placeholder}
          value={draft}
        />
        <Button onClick={addItem} size="icon" type="button" variant="outline">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {items.map((item, index) => {
          const isEditing = editingIndex === index;

          return (
            <div
              className="rounded-xl border border-[var(--border)] bg-[rgba(18,11,33,0.78)] p-2"
              key={`${item}-${index}`}
            >
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    onBlur={saveEdit}
                    onChange={(event) => setEditingValue(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        saveEdit();
                      }
                      if (event.key === "Escape") {
                        event.preventDefault();
                        setEditingIndex(null);
                        setEditingValue("");
                      }
                    }}
                    value={editingValue}
                  />
                  <Button onClick={saveEdit} size="icon" type="button" variant="outline">
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingIndex(null);
                      setEditingValue("");
                    }}
                    size="icon"
                    type="button"
                    variant="ghost"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      "min-w-0 flex-1 truncate px-1 text-sm font-medium text-[var(--foreground)]",
                    )}
                    title={item}
                  >
                    {item}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => {
                        setEditingIndex(index);
                        setEditingValue(item);
                      }}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => removeItem(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(16,10,28,0.6)] px-3 py-4 text-sm text-[var(--muted)]">
            Nenhum item configurado.
          </div>
        ) : null}
      </div>
    </section>
  );
}
