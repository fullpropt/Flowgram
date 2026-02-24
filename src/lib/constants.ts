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

// Compat exports used in older components; prefer store-configured lists in UI.
export const PILARES = DEFAULT_GROUPS;
export const OBJETIVOS = DEFAULT_OBJECTIVES;

export const DEFAULT_WORKSPACE_TAXONOMY: WorkspaceTaxonomyConfig = {
  grupos: [...DEFAULT_GROUPS],
  objetivos: [...DEFAULT_OBJECTIVES],
  tags: [],
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

const namedGroupTones: Record<string, string> = {
  Dor: "from-[#ff6b8f] to-[#ff925a]",
  Educacao: "from-[#59c9ff] to-[#52f1ff]",
  Solucao: "from-[#9dff87] to-[#56f0ad]",
  Construcao: "from-[#f857b2] to-[#a83cff]",
};

const groupTonePalette = [
  "from-[#ff6b8f] to-[#ff925a]",
  "from-[#59c9ff] to-[#52f1ff]",
  "from-[#9dff87] to-[#56f0ad]",
  "from-[#f857b2] to-[#a83cff]",
  "from-[#ffc85a] to-[#ff8d60]",
  "from-[#8ef7d5] to-[#43d2ff]",
];

export function getGroupTone(group?: string) {
  if (!group) return "from-[#5b477f] to-[#392953]";
  if (namedGroupTones[group]) return namedGroupTones[group];

  let hash = 0;
  for (let i = 0; i < group.length; i += 1) {
    hash = (hash * 31 + group.charCodeAt(i)) >>> 0;
  }

  return groupTonePalette[hash % groupTonePalette.length];
}

