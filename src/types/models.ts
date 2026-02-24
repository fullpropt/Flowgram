export type Pilar = "Dor" | "Educacao" | "Solucao" | "Construcao";

export type Formato =
  | "Carrossel"
  | "Reels"
  | "Print"
  | "Imagem unica"
  | "Story";

export type Objetivo =
  | "Engajamento"
  | "Autoridade"
  | "Lista de espera"
  | "Hype"
  | "Conversao";

export type IdeaStatus =
  | "Ideia"
  | "Roteirizado"
  | "Criado"
  | "Agendado"
  | "Publicado";

export type Canal = "Feed" | "Reels" | "Story";

export interface IdeaLayers {
  macroTema?: string;
  formato?: Formato;
  objetivo?: Objetivo;
  hook?: string;
  cta?: string;
}

export interface IdeaCard {
  id: string;
  titulo: string;
  descricao?: string;
  pilar?: Pilar;
  camadas: IdeaLayers;
  status: IdeaStatus;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarPost {
  id: string;
  ideaCardId?: string;
  titulo: string;
  dataInicio: string;
  dataFim?: string;
  canal: Canal;
  observacoes?: string;
}

export interface TrashedIdeaCard {
  card: IdeaCard;
  relatedCalendarPosts: CalendarPost[];
  deletedAt: string;
  expiresAt: string;
}

export interface IdeaCardInput {
  titulo: string;
  descricao?: string;
  pilar?: Pilar;
  camadas?: IdeaLayers;
  status?: IdeaStatus;
  tags?: string[];
}

export interface CalendarPostInput {
  ideaCardId?: string;
  titulo: string;
  dataInicio: string;
  dataFim?: string;
  canal: Canal;
  observacoes?: string;
}
