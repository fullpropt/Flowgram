import { Formato, IdeaStatus, Objetivo, Pilar } from "@/types/models";

export const PILARES: Pilar[] = ["Dor", "Educação", "Solução", "Construção"];
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
  "Imagem única",
  "Story",
];
export const OBJETIVOS: Objetivo[] = [
  "Engajamento",
  "Autoridade",
  "Lista de espera",
  "Hype",
  "Conversão",
];

export const pilarLabel: Record<Pilar, string> = {
  Dor: "Dor",
  Educação: "Educação",
  Solução: "Solução",
  Construção: "Construção",
};

export const formatoLabel: Record<Formato, string> = {
  Carrossel: "Carrossel",
  Reels: "Reels",
  Print: "Print",
  "Imagem única": "Imagem única",
  Story: "Story",
};

export const objetivoLabel: Record<Objetivo, string> = {
  Engajamento: "Engajamento",
  Autoridade: "Autoridade",
  "Lista de espera": "Lista de espera",
  Hype: "Hype",
  Conversão: "Conversão",
};

export const statusLabel: Record<IdeaStatus, string> = {
  Ideia: "Ideia",
  Roteirizado: "Roteirizado",
  Criado: "Criado",
  Agendado: "Agendado",
  Publicado: "Publicado",
};
