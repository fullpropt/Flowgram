import { Formato, IdeaStatus, Objetivo, Pilar, WorkspaceTaxonomyConfig } from "@/types/models";

export const DEFAULT_GROUPS: Pilar[] = ["Dor", "Educacao", "Solucao", "Construcao"];
export const STATUSES: IdeaStatus[] = [
  "Ideia",
  "Roteirizado",
  "Criado",
  "Agendado",
  "Publicado",
];
export const FORMATOS: Formato[] = [
  "Carrossel",
  "Reels",
  "Print",
  "Imagem unica",
  "Story",
];
export const DEFAULT_OBJECTIVES: Objetivo[] = [
  "Engajamento",
  "Autoridade",
  "Lista de espera",
  "Hype",
  "Conversao",
];

export const GROUP_COLOR_PRESETS = [
  { key: "sunset-rose", label: "Rosa Sunset", tone: "from-[#ff6b8f] to-[#ff925a]" },
  { key: "sky-cyan", label: "Azul Cyan", tone: "from-[#59c9ff] to-[#52f1ff]" },
  { key: "lime-mint", label: "Lima Mint", tone: "from-[#9dff87] to-[#56f0ad]" },
  { key: "fuchsia-violet", label: "Fucsia Violeta", tone: "from-[#f857b2] to-[#a83cff]" },
  { key: "gold-coral", label: "Dourado Coral", tone: "from-[#ffc85a] to-[#ff8d60]" },
  { key: "teal-blue", label: "Turquesa Azul", tone: "from-[#8ef7d5] to-[#43d2ff]" },
  { key: "peach-pink", label: "Pessego Rosa", tone: "from-[#ffb38a] to-[#ff6dc7]" },
  { key: "indigo-magenta", label: "Indigo Magenta", tone: "from-[#6d7bff] to-[#d56bff]" },
  { key: "green-aqua", label: "Verde Aqua", tone: "from-[#71f7a5] to-[#2fd6c8]" },
  { key: "amber-red", label: "Amber Vermelho", tone: "from-[#ffd166] to-[#ef476f]" },
  { key: "violet-blue", label: "Violeta Azul", tone: "from-[#b98bff] to-[#5fa8ff]" },
  { key: "mint-lime", label: "Mint Lima", tone: "from-[#8dffcf] to-[#b6ff5c]" },
] as const;

export type GroupColorPresetKey = (typeof GROUP_COLOR_PRESETS)[number]["key"];

const GROUP_COLOR_PRESET_MAP: Record<GroupColorPresetKey, (typeof GROUP_COLOR_PRESETS)[number]> =
  Object.fromEntries(
    GROUP_COLOR_PRESETS.map((preset) => [preset.key, preset]),
  ) as Record<GroupColorPresetKey, (typeof GROUP_COLOR_PRESETS)[number]>;

const DEFAULT_GROUP_COLOR_BY_NAME: Record<string, GroupColorPresetKey> = {
  Dor: "sunset-rose",
  Educacao: "sky-cyan",
  Solucao: "lime-mint",
  Construcao: "fuchsia-violet",
};

// Compat exports used in older components; prefer store-configured lists in UI.
export const PILARES = DEFAULT_GROUPS;
export const OBJETIVOS = DEFAULT_OBJECTIVES;

export const DEFAULT_WORKSPACE_TAXONOMY: WorkspaceTaxonomyConfig = {
  grupos: [...DEFAULT_GROUPS],
  objetivos: [...DEFAULT_OBJECTIVES],
  tags: [],
  groupColors: {
    Dor: DEFAULT_GROUP_COLOR_BY_NAME.Dor,
    Educacao: DEFAULT_GROUP_COLOR_BY_NAME.Educacao,
    Solucao: DEFAULT_GROUP_COLOR_BY_NAME.Solucao,
    Construcao: DEFAULT_GROUP_COLOR_BY_NAME.Construcao,
  },
};

export function getGroupLabel(group?: string) {
  return group?.trim() || "Nao definido";
}

export function getObjetivoLabel(objective?: string) {
  return objective?.trim() || "Nao definido";
}

export const formatoLabel: Record<Formato, string> = {
  Carrossel: "Carrossel",
  Reels: "Reels",
  Print: "Print",
  "Imagem unica": "Imagem unica",
  Story: "Story",
};

export const statusLabel: Record<IdeaStatus, string> = {
  Ideia: "Ideia",
  Roteirizado: "Roteirizado",
  Criado: "Criado",
  Agendado: "Agendado",
  Publicado: "Publicado",
};

export function getDefaultGroupColorKey(group: string): GroupColorPresetKey {
  if (DEFAULT_GROUP_COLOR_BY_NAME[group]) return DEFAULT_GROUP_COLOR_BY_NAME[group];

  let hash = 0;
  for (let i = 0; i < group.length; i += 1) {
    hash = (hash * 31 + group.charCodeAt(i)) >>> 0;
  }

  return GROUP_COLOR_PRESETS[hash % GROUP_COLOR_PRESETS.length]!.key;
}

export function resolveGroupColorKey(
  group?: string,
  groupColors?: Record<string, string>,
): GroupColorPresetKey | null {
  if (!group) return null;
  const configured = groupColors?.[group];
  if (configured && configured in GROUP_COLOR_PRESET_MAP) {
    return configured as GroupColorPresetKey;
  }

  return getDefaultGroupColorKey(group);
}

export function getGroupTone(group?: string, groupColors?: Record<string, string>) {
  if (!group) return "from-[#5b477f] to-[#392953]";
  const colorKey = resolveGroupColorKey(group, groupColors);
  if (!colorKey) return "from-[#5b477f] to-[#392953]";
  return GROUP_COLOR_PRESET_MAP[colorKey]?.tone ?? "from-[#5b477f] to-[#392953]";
}
