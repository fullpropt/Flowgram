import { Formato, IdeaStatus, Objetivo, Pilar } from "@/types/models";

export const PILARES: Pilar[] = ["Dor", "Educacao", "Solucao", "Construcao"];
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
export const OBJETIVOS: Objetivo[] = [
  "Engajamento",
  "Autoridade",
  "Lista de espera",
  "Hype",
  "Conversao",
];

export const pilarLabel: Record<Pilar, string> = {
  Dor: "Dor",
  Educacao: "Educacao",
  Solucao: "Solucao",
  Construcao: "Construcao",
};

export const formatoLabel: Record<Formato, string> = {
  Carrossel: "Carrossel",
  Reels: "Reels",
  Print: "Print",
  "Imagem unica": "Imagem unica",
  Story: "Story",
};

export const objetivoLabel: Record<Objetivo, string> = {
  Engajamento: "Engajamento",
  Autoridade: "Autoridade",
  "Lista de espera": "Lista de espera",
  Hype: "Hype",
  Conversao: "Conversao",
};

export const statusLabel: Record<IdeaStatus, string> = {
  Ideia: "Ideia",
  Roteirizado: "Roteirizado",
  Criado: "Criado",
  Agendado: "Agendado",
  Publicado: "Publicado",
};
