"use client";

import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { loadAppState, saveAppState } from "@/services/state-api.repository";
import {
  CalendarPost,
  CalendarPostInput,
  Canal,
  IdeaCard,
  IdeaCardInput,
  IdeaStatus,
  Pilar,
} from "@/types/models";

interface AppState {
  cards: IdeaCard[];
  calendarPosts: CalendarPost[];
  hydrated: boolean;
  isCardModalOpen: boolean;
  activeCardId: string | null;
  initializeData: () => Promise<void>;
  openCardModal: (cardId?: string | null) => void;
  closeCardModal: () => void;
  addCard: (input: IdeaCardInput) => IdeaCard;
  updateCard: (id: string, updates: Partial<IdeaCardInput>) => void;
  duplicateCard: (id: string) => void;
  deleteCard: (id: string) => void;
  moveCardPillar: (id: string, pilar: Pilar) => void;
  markCardStatus: (id: string, status: IdeaStatus) => void;
  addCalendarPost: (input: CalendarPostInput) => CalendarPost;
  updateCalendarPost: (id: string, updates: Partial<CalendarPostInput>) => void;
  deleteCalendarPost: (id: string) => void;
  generateWeekSuggestions: (
    startDateIso: string,
    includeConstrucao: boolean,
  ) => IdeaCard[];
  scheduleWeekSuggestions: (
    startDateIso: string,
    includeConstrucao: boolean,
  ) => CalendarPost[];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeCard(input: IdeaCardInput): IdeaCard {
  const now = nowIso();
  return {
    id: uuidv4(),
    titulo: input.titulo.trim(),
    descricao: input.descricao?.trim(),
    pilar: input.pilar,
    camadas: input.camadas ?? {},
    status: input.status ?? "Ideia",
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
}

function toCanalFromCard(card: IdeaCard): Canal {
  const formato = card.camadas.formato;
  if (formato === "Reels") return "Reels";
  if (formato === "Story") return "Story";
  return "Feed";
}

function parseDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getDefaultEnd(startIso: string, endIso?: string) {
  if (endIso) return endIso;
  return addDays(parseDate(startIso), 1).toISOString();
}

function pickCardByPillar(
  cards: IdeaCard[],
  pilar: Pilar,
  usedIds: Set<string>,
): IdeaCard | undefined {
  const candidates = cards
    .filter((card) => card.pilar === pilar && !usedIds.has(card.id))
    .sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    );
  return candidates[0];
}

async function persistState(cards: IdeaCard[], calendarPosts: CalendarPost[]) {
  try {
    await saveAppState(cards, calendarPosts);
  } catch (error) {
    console.error("Falha ao persistir estado remoto", error);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  cards: [],
  calendarPosts: [],
  hydrated: false,
  isCardModalOpen: false,
  activeCardId: null,
  initializeData: async () => {
    if (get().hydrated) return;

    try {
      const state = await loadAppState();
      set({
        cards: state.cards ?? [],
        calendarPosts: state.calendarPosts ?? [],
        hydrated: true,
      });
    } catch (error) {
      console.error("Falha ao carregar estado inicial", error);
      set({ hydrated: true });
    }
  },
  openCardModal: (cardId = null) =>
    set({ isCardModalOpen: true, activeCardId: cardId }),
  closeCardModal: () => set({ isCardModalOpen: false, activeCardId: null }),
  addCard: (input) => {
    const newCard = normalizeCard(input);
    set((state) => {
      const cards = [newCard, ...state.cards];
      void persistState(cards, state.calendarPosts);
      return { cards };
    });
    return newCard;
  },
  updateCard: (id, updates) => {
    set((state) => {
      const cards = state.cards.map((card) =>
        card.id === id
          ? {
              ...card,
              ...updates,
              camadas: {
                ...card.camadas,
                ...updates.camadas,
              },
              updatedAt: nowIso(),
            }
          : card,
      );
      void persistState(cards, state.calendarPosts);
      return { cards };
    });
  },
  duplicateCard: (id) => {
    const original = get().cards.find((card) => card.id === id);
    if (!original) return;

    const now = nowIso();
    const duplicated: IdeaCard = {
      ...original,
      id: uuidv4(),
      titulo: `${original.titulo} (Copia)`,
      status: "Ideia",
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const cards = [duplicated, ...state.cards];
      void persistState(cards, state.calendarPosts);
      return { cards };
    });
  },
  deleteCard: (id) => {
    set((state) => {
      const cards = state.cards.filter((card) => card.id !== id);
      const calendarPosts = state.calendarPosts.filter(
        (post) => post.ideaCardId !== id,
      );
      void persistState(cards, calendarPosts);
      return { cards, calendarPosts };
    });
  },
  moveCardPillar: (id, pilar) => {
    set((state) => {
      const cards = state.cards.map((card) =>
        card.id === id ? { ...card, pilar, updatedAt: nowIso() } : card,
      );
      void persistState(cards, state.calendarPosts);
      return { cards };
    });
  },
  markCardStatus: (id, status) => {
    set((state) => {
      const cards = state.cards.map((card) =>
        card.id === id ? { ...card, status, updatedAt: nowIso() } : card,
      );
      void persistState(cards, state.calendarPosts);
      return { cards };
    });
  },
  addCalendarPost: (input) => {
    const newPost: CalendarPost = {
      id: uuidv4(),
      ideaCardId: input.ideaCardId,
      titulo: input.titulo.trim(),
      dataInicio: input.dataInicio,
      dataFim: getDefaultEnd(input.dataInicio, input.dataFim),
      canal: input.canal,
      observacoes: input.observacoes?.trim(),
    };

    set((state) => {
      const calendarPosts = [newPost, ...state.calendarPosts];
      const cards: IdeaCard[] = state.cards.map((card) =>
        card.id === input.ideaCardId
          ? { ...card, status: "Agendado" as const, updatedAt: nowIso() }
          : card,
      );
      void persistState(cards, calendarPosts);
      return { cards, calendarPosts };
    });

    return newPost;
  },
  updateCalendarPost: (id, updates) => {
    set((state) => {
      const calendarPosts = state.calendarPosts.map((post) =>
        post.id === id
          ? {
              ...post,
              ...updates,
              dataFim: getDefaultEnd(
                updates.dataInicio ?? post.dataInicio,
                updates.dataFim ?? post.dataFim,
              ),
            }
          : post,
      );
      void persistState(state.cards, calendarPosts);
      return { calendarPosts };
    });
  },
  deleteCalendarPost: (id) => {
    set((state) => {
      const calendarPosts = state.calendarPosts.filter((post) => post.id !== id);
      void persistState(state.cards, calendarPosts);
      return { calendarPosts };
    });
  },
  generateWeekSuggestions: (_, includeConstrucao) => {
    const { cards, calendarPosts } = get();
    const scheduledIds = new Set(
      calendarPosts
        .map((post) => post.ideaCardId)
        .filter((id): id is string => Boolean(id)),
    );

    const preferred = cards.filter(
      (card) =>
        !scheduledIds.has(card.id) &&
        (card.status === "Ideia" || card.status === "Roteirizado"),
    );
    const fallback = cards.filter((card) => !scheduledIds.has(card.id));
    const basePool = preferred.length > 0 ? preferred : fallback;

    const used = new Set<string>();
    const suggestions: IdeaCard[] = [];
    const requiredPillars: Pilar[] = ["Dor", "Educacao", "Solucao"];

    requiredPillars.forEach((pilar) => {
      const picked = pickCardByPillar(basePool, pilar, used);
      if (picked) {
        used.add(picked.id);
        suggestions.push(picked);
      }
    });

    if (includeConstrucao) {
      const buildCard = pickCardByPillar(basePool, "Construcao", used);
      if (buildCard) suggestions.push(buildCard);
    }

    return suggestions;
  },
  scheduleWeekSuggestions: (startDateIso, includeConstrucao) => {
    const suggestions = get().generateWeekSuggestions(
      startDateIso,
      includeConstrucao,
    );
    if (suggestions.length === 0) return [];

    const startDate = parseDate(startDateIso);
    const offsets = [0, 2, 4, 6];
    const newPosts: CalendarPost[] = suggestions.map((card, index) => {
      const date = addDays(startDate, offsets[index] ?? index);
      return {
        id: uuidv4(),
        ideaCardId: card.id,
        titulo: card.titulo,
        dataInicio: date.toISOString(),
        dataFim: addDays(date, 1).toISOString(),
        canal: toCanalFromCard(card),
      };
    });

    set((state) => {
      const calendarPosts = [...newPosts, ...state.calendarPosts];
      const scheduledIds = new Set(newPosts.map((post) => post.ideaCardId));
      const cards: IdeaCard[] = state.cards.map((card) =>
        scheduledIds.has(card.id)
          ? { ...card, status: "Agendado" as const, updatedAt: nowIso() }
          : card,
      );
      void persistState(cards, calendarPosts);
      return { cards, calendarPosts };
    });

    return newPosts;
  },
}));
