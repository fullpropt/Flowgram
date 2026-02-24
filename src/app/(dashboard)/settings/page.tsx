"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  GROUP_COLOR_PRESETS,
  type GroupColorPresetKey,
  getDefaultGroupColorKey,
  getGroupTone,
  resolveGroupColorKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

type ListTaxonomyKey = "objetivos" | "tags";

export default function SettingsPage() {
  const taxonomyConfig = useAppStore((state) => state.taxonomyConfig);
  const setTaxonomyList = useAppStore((state) => state.setTaxonomyList);
  const setTaxonomyConfig = useAppStore((state) => state.setTaxonomyConfig);

  const sections = useMemo(
    () =>
      [
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
        key: ListTaxonomyKey;
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
          Lab
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
          Configuracoes Lab
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Personalize grupos, objetivos e tags usados em todo o Flowgram Lab.
        </p>
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <GroupListPanel
          groupColors={taxonomyConfig.groupColors}
          groups={taxonomyConfig.grupos}
          onChange={(grupos, groupColors) => setTaxonomyConfig({ grupos, groupColors })}
        />

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

function normalizeStringList(values: string[]) {
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

function sanitizeGroupColors(
  groups: string[],
  colorMap: Record<string, string>,
) {
  const next: Record<string, string> = {};

  groups.forEach((group) => {
    const resolved = resolveGroupColorKey(group, colorMap) ?? getDefaultGroupColorKey(group);
    next[group] = resolved;
  });

  return next;
}

function nextColorKeyForNewGroup(existingGroups: string[], colorMap: Record<string, string>) {
  const usedCounts = new Map<string, number>();
  existingGroups.forEach((group) => {
    const key = resolveGroupColorKey(group, colorMap);
    if (!key) return;
    usedCounts.set(key, (usedCounts.get(key) ?? 0) + 1);
  });

  const sorted = [...GROUP_COLOR_PRESETS].sort(
    (a, b) => (usedCounts.get(a.key) ?? 0) - (usedCounts.get(b.key) ?? 0),
  );

  return sorted[0]?.key ?? GROUP_COLOR_PRESETS[0]!.key;
}

function GroupListPanel({
  groups,
  groupColors,
  onChange,
}: {
  groups: string[];
  groupColors: Record<string, string>;
  onChange: (groups: string[], groupColors: Record<string, string>) => void;
}) {
  const [draft, setDraft] = useState("");
  const [draftColorKey, setDraftColorKey] = useState<GroupColorPresetKey>(() =>
    nextColorKeyForNewGroup(groups, groupColors),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isAddColorMenuOpen, setIsAddColorMenuOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingColorKey, setEditingColorKey] = useState<GroupColorPresetKey>(
    GROUP_COLOR_PRESETS[0]!.key,
  );

  function commit(nextGroupsRaw: string[], nextColorMapRaw: Record<string, string>) {
    const nextGroups = normalizeStringList(nextGroupsRaw);
    const nextGroupColors = sanitizeGroupColors(nextGroups, nextColorMapRaw);
    onChange(nextGroups, nextGroupColors);
    setDraftColorKey(nextColorKeyForNewGroup(nextGroups, nextGroupColors));
  }

  function addGroup() {
    const value = draft.trim();
    if (!value) return;
    commit([...groups, value], { ...groupColors, [value]: draftColorKey });
    setDraft("");
    setIsAdding(false);
    setIsAddColorMenuOpen(false);
  }

  function openAddForm() {
    setDraft("");
    setDraftColorKey(nextColorKeyForNewGroup(groups, groupColors));
    setIsAdding(true);
  }

  function cancelAddForm() {
    setDraft("");
    setIsAdding(false);
    setIsAddColorMenuOpen(false);
    setDraftColorKey(nextColorKeyForNewGroup(groups, groupColors));
  }

  function startEditing(index: number) {
    const group = groups[index];
    if (!group) return;
    setEditingIndex(index);
    setEditingValue(group);
    setEditingColorKey(resolveGroupColorKey(group, groupColors) ?? getDefaultGroupColorKey(group));
  }

  function cancelEditing() {
    setEditingIndex(null);
    setEditingValue("");
  }

  function saveEditing() {
    if (editingIndex === null) return;
    const previousName = groups[editingIndex];
    if (!previousName) {
      cancelEditing();
      return;
    }

    const nextName = editingValue.trim();
    if (!nextName) {
      cancelEditing();
      return;
    }

    const nextGroupsRaw = groups.map((group, index) => (index === editingIndex ? nextName : group));
    const nextColorMap = { ...groupColors };
    const previousColor =
      nextColorMap[previousName] ??
      resolveGroupColorKey(previousName, groupColors) ??
      getDefaultGroupColorKey(previousName);
    delete nextColorMap[previousName];
    nextColorMap[nextName] = editingColorKey || previousColor;

    commit(nextGroupsRaw, nextColorMap);
    cancelEditing();
  }

  function removeGroup(indexToRemove: number) {
    const target = groups[indexToRemove];
    const nextGroups = groups.filter((_, index) => index !== indexToRemove);
    const nextColorMap = { ...groupColors };
    if (target) delete nextColorMap[target];
    commit(nextGroups, nextColorMap);
    if (editingIndex === indexToRemove) cancelEditing();
  }

  return (
    <section className="panel-soft flex min-h-[320px] flex-col p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
          Grupos
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Categorias usadas para organizar os cards no Banco de Ideias e no Calendario.
        </p>
      </div>

      <div className="mb-3">
        {!isAdding ? (
          <Button onClick={openAddForm} size="icon" type="button" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex items-start gap-2">
            <ColorSwatchMenu
              onChange={(key) => {
                setDraftColorKey(key);
                setIsAddColorMenuOpen(false);
              }}
              onOpenChange={setIsAddColorMenuOpen}
              open={isAddColorMenuOpen}
              selectedKey={draftColorKey}
            />
            <Input
              autoFocus
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addGroup();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  cancelAddForm();
                }
              }}
              placeholder="Ex: Bastidores"
              value={draft}
            />
            <Button onClick={addGroup} size="icon" type="button" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
            <Button onClick={cancelAddForm} size="icon" type="button" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {groups.map((group, index) => {
          const isEditing = editingIndex === index;
          const colorKey = resolveGroupColorKey(group, groupColors) ?? getDefaultGroupColorKey(group);

          return (
            <div
              className="rounded-xl border border-[var(--border)] bg-[rgba(18,11,33,0.78)] p-2"
              key={`${group}-${index}`}
            >
              {isEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      autoFocus
                      onChange={(event) => setEditingValue(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          saveEditing();
                        }
                        if (event.key === "Escape") {
                          event.preventDefault();
                          cancelEditing();
                        }
                      }}
                      value={editingValue}
                    />
                    <Button onClick={saveEditing} size="icon" type="button" variant="outline">
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button onClick={cancelEditing} size="icon" type="button" variant="ghost">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <ColorPresetPicker
                    compact
                    label="Cor do grupo"
                    onChange={setEditingColorKey}
                    selectedKey={editingColorKey}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={cn(
                        "h-4 w-4 shrink-0 rounded-full border border-[rgba(255,255,255,0.22)] bg-gradient-to-br",
                        getGroupTone(group, groupColors),
                      )}
                      title="Cor do grupo"
                    />
                    <p
                      className="min-w-0 flex-1 truncate px-1 text-sm font-medium text-[var(--foreground)]"
                      title={group}
                    >
                      {group}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => startEditing(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => removeGroup(index)}
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

        {groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[rgba(16,10,28,0.6)] px-3 py-4 text-sm text-[var(--muted)]">
            Nenhum grupo configurado.
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ColorSwatchMenu({
  selectedKey,
  open,
  onOpenChange,
  onChange,
}: {
  selectedKey: GroupColorPresetKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (key: GroupColorPresetKey) => void;
}) {
  const activePreset =
    GROUP_COLOR_PRESETS.find((preset) => preset.key === selectedKey) ?? GROUP_COLOR_PRESETS[0]!;

  return (
    <div className="relative shrink-0">
      <button
        aria-expanded={open}
        className={cn(
          "h-10 w-10 rounded-xl border border-[var(--border)] p-1.5 transition",
          open
            ? "bg-[rgba(25,16,43,0.95)] ring-2 ring-[rgba(249,87,192,0.22)]"
            : "bg-[rgba(19,12,36,0.84)] hover:border-[#6a3d93]",
        )}
        onClick={() => onOpenChange(!open)}
        title={`Cor do grupo: ${activePreset.label}`}
        type="button"
      >
        <span
          className={cn(
            "block h-full w-full rounded-md border border-[rgba(255,255,255,0.22)] bg-gradient-to-r",
            activePreset.tone,
          )}
        />
        <span className="sr-only">Selecionar cor do grupo</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-12 z-20 w-[236px] rounded-xl border border-[var(--border)] bg-[rgba(14,9,26,0.96)] p-2 shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
          <div className="grid grid-cols-6 gap-2">
            {GROUP_COLOR_PRESETS.map((preset) => {
              const active = preset.key === selectedKey;
              return (
                <button
                  className={cn(
                    "h-7 rounded-md border bg-gradient-to-r transition",
                    preset.tone,
                    active
                      ? "border-[#f5d7ff] ring-2 ring-[rgba(249,87,192,0.32)]"
                      : "border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.35)]",
                  )}
                  key={preset.key}
                  onClick={() => onChange(preset.key)}
                  title={preset.label}
                  type="button"
                >
                  <span className="sr-only">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ColorPresetPicker({
  selectedKey,
  onChange,
  label,
  compact = false,
}: {
  selectedKey: GroupColorPresetKey;
  onChange: (key: GroupColorPresetKey) => void;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-1">
      <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
        {label}
      </span>
      <div className={cn("grid grid-cols-6 gap-2", compact && "gap-1.5")}>
        {GROUP_COLOR_PRESETS.map((preset) => {
          const active = preset.key === selectedKey;
          return (
            <button
              className={cn(
                "relative h-7 rounded-lg border transition",
                "bg-gradient-to-r",
                preset.tone,
                active
                  ? "border-[#f5d7ff] ring-2 ring-[rgba(249,87,192,0.32)]"
                  : "border-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.35)]",
                compact && "h-6 rounded-md",
              )}
              key={preset.key}
              onClick={() => onChange(preset.key)}
              title={preset.label}
              type="button"
            >
              <span className="sr-only">{preset.label}</span>
            </button>
          );
        })}
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

  function addItem() {
    const value = draft.trim();
    if (!value) return;
    onChange(normalizeStringList([...items, value]));
    setDraft("");
  }

  function saveEdit() {
    if (editingIndex === null) return;

    const nextItems = items.map((item, index) => (index === editingIndex ? editingValue : item));
    onChange(normalizeStringList(nextItems));
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
