"use client";

import { addDays } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { create } from "zustand";
import { DEFAULT_WORKSPACE_TAXONOMY } from "@/lib/constants";
import { loadAppState, saveAppState } from "@/services/state-api.repository";
import {
  CalendarPost,
  CalendarPostInput,
  Canal,
  IdeaCard,
  IdeaCardInput,
  IdeaStatus,
  Pilar,
  TrashedIdeaCard,
  WorkspaceTaxonomyConfig,
} from "@/types/models";

interface AppState {
  cards: IdeaCard[];
  calendarPosts: CalendarPost[];
  trashedCards: TrashedIdeaCard[];
  taxonomyConfig: WorkspaceTaxonomyConfig;
  hydrated: boolean;
  isCardModalOpen: boolean;
  activeCardId: string | null;
  initializeData: () => Promise<void>;
  setTaxonomyList: (
    kind: keyof WorkspaceTaxonomyConfig,
    values: string[],
  ) => void;
  openCardModal: (cardId?: string | null) => void;
  closeCardModal: () => void;
  addCard: (input: IdeaCardInput) => IdeaCard;
  updateCard: (id: string, updates: Partial<IdeaCardInput>) => void;
  duplicateCard: (id: string) => void;
  deleteCard: (id: string) => void;
  restoreTrashedCard: (cardId: string) => void;
  purgeTrashedCard: (cardId: string) => void;
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

const TAXONOMY_STORAGE_KEY = "flowgram-lab-taxonomy-v1";

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

function normalizeTaxonomyList(values: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  values.forEach((rawValue) => {
    const value = rawValue.trim();
    if (!value) return;
    const key = value.toLocaleLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    normalized.push(value);
  });

  return normalized;
}

function normalizeTaxonomyConfig(
  input?: Partial<WorkspaceTaxonomyConfig> | null,
): WorkspaceTaxonomyConfig {
  return {
    grupos: normalizeTaxonomyList(input?.grupos ?? DEFAULT_WORKSPACE_TAXONOMY.grupos),
    objetivos: normalizeTaxonomyList(input?.objetivos ?? DEFAULT_WORKSPACE_TAXONOMY.objetivos),
    tags: normalizeTaxonomyList(input?.tags ?? DEFAULT_WORKSPACE_TAXONOMY.tags),
  };
}

function loadTaxonomyConfigFromStorage() {
  if (typeof window === "undefined") return normalizeTaxonomyConfig();

  try {
    const raw = window.localStorage.getItem(TAXONOMY_STORAGE_KEY);
    if (!raw) return normalizeTaxonomyConfig();
    const parsed = JSON.parse(raw) as Partial<WorkspaceTaxonomyConfig>;
    return normalizeTaxonomyConfig(parsed);
  } catch (error) {
    console.error("Falha ao carregar configuracoes locais", error);
    return normalizeTaxonomyConfig();
  }
}

function saveTaxonomyConfigToStorage(config: WorkspaceTaxonomyConfig) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Falha ao salvar configuracoes locais", error);
  }
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

const TRASH_RETENTION_DAYS = 7;

function isTrashExpired(item: TrashedIdeaCard, referenceDate = new Date()) {
  return new Date(item.expiresAt).getTime() <= referenceDate.getTime();
}

function pruneExpiredTrash(items: TrashedIdeaCard[], referenceDate = new Date()) {
  return items.filter((item) => !isTrashExpired(item, referenceDate));
}

function buildTrashedItem(card: IdeaCard, relatedCalendarPosts: CalendarPost[]): TrashedIdeaCard {
  const deletedAt = new Date();
  return {
    card,
    relatedCalendarPosts,
    deletedAt: deletedAt.toISOString(),
    expiresAt: addDays(deletedAt, TRASH_RETENTION_DAYS).toISOString(),
  };
}

async function persistState(
  cards: IdeaCard[],
  calendarPosts: CalendarPost[],
  trashedCards: TrashedIdeaCard[],
) {
  try {
    await saveAppState(cards, calendarPosts, trashedCards);
  } catch (error) {
    console.error("Falha ao persistir estado remoto", error);
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  cards: [],
  calendarPosts: [],
  trashedCards: [],
  taxonomyConfig: normalizeTaxonomyConfig(),
  hydrated: false,
  isCardModalOpen: false,
  activeCardId: null,
  initializeData: async () => {
    if (get().hydrated) return;

    try {
      const state = await loadAppState();
      const cards = state.cards ?? [];
      const calendarPosts = state.calendarPosts ?? [];
      const trashedCards = pruneExpiredTrash(state.trashedCards ?? []);
      const taxonomyConfig = loadTaxonomyConfigFromStorage();
      set({
        cards,
        calendarPosts,
        trashedCards,
        taxonomyConfig,
        hydrated: true,
      });

      if ((state.trashedCards ?? []).length !== trashedCards.length) {
        void persistState(cards, calendarPosts, trashedCards);
      }
    } catch (error) {
      console.error("Falha ao carregar estado inicial", error);
      set({
        hydrated: true,
        taxonomyConfig: loadTaxonomyConfigFromStorage(),
      });
    }
  },
  setTaxonomyList: (kind, values) => {
    set((state) => {
      const taxonomyConfig = normalizeTaxonomyConfig({
        ...state.taxonomyConfig,
        [kind]: values,
      });
      saveTaxonomyConfigToStorage(taxonomyConfig);
      return { taxonomyConfig };
    });
  },
  openCardModal: (cardId = null) =>
    set({ isCardModalOpen: true, activeCardId: cardId }),
  closeCardModal: () => set({ isCardModalOpen: false, activeCardId: null }),
  addCard: (input) => {
    const newCard = normalizeCard(input);
    set((state) => {
      const cards = [newCard, ...state.cards];
      void persistState(cards, state.calendarPosts, state.trashedCards);
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
      void persistState(cards, state.calendarPosts, state.trashedCards);
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
      void persistState(cards, state.calendarPosts, state.trashedCards);
      return { cards };
    });
  },
  deleteCard: (id) => {
    set((state) => {
      const cardToDelete = state.cards.find((card) => card.id === id);
      if (!cardToDelete) return {};

      const cards = state.cards.filter((card) => card.id !== id);
      const relatedCalendarPosts = state.calendarPosts.filter(
        (post) => post.ideaCardId === id,
      );
      const calendarPosts = state.calendarPosts.filter((post) => post.ideaCardId !== id);
      const trashedCards = pruneExpiredTrash([
        buildTrashedItem(cardToDelete, relatedCalendarPosts),
        ...state.trashedCards.filter((item) => item.card.id !== id),
      ]);

      void persistState(cards, calendarPosts, trashedCards);
      return { cards, calendarPosts, trashedCards };
    });
  },
  restoreTrashedCard: (cardId) => {
    set((state) => {
      const now = new Date();
      const validTrash = pruneExpiredTrash(state.trashedCards, now);
      const target = validTrash.find((item) => item.card.id === cardId);
      if (!target) {
        if (validTrash.length !== state.trashedCards.length) {
          void persistState(state.cards, state.calendarPosts, validTrash);
          return { trashedCards: validTrash };
        }
        return {};
      }

      const trashedCards = validTrash.filter((item) => item.card.id !== cardId);
      const existingCardIds = new Set(state.cards.map((card) => card.id));
      const cards = existingCardIds.has(target.card.id)
        ? state.cards
        : [target.card, ...state.cards];

      const existingPostIds = new Set(state.calendarPosts.map((post) => post.id));
      const restoredPosts = target.relatedCalendarPosts.filter((post) => !existingPostIds.has(post.id));
      const calendarPosts = restoredPosts.length > 0
        ? [...restoredPosts, ...state.calendarPosts]
        : state.calendarPosts;

      const restoredPostIds = new Set(restoredPosts.map((post) => post.ideaCardId).filter(Boolean));
      const normalizedCards = cards.map((card) => {
        if (card.id !== target.card.id) return card;
        if (restoredPostIds.has(card.id)) {
          return { ...card, status: "Agendado" as const, updatedAt: nowIso() };
        }
        if (card.status === "Agendado") {
          return { ...card, status: "Criado" as const, updatedAt: nowIso() };
        }
        return card;
      });

      void persistState(normalizedCards, calendarPosts, trashedCards);
      return { cards: normalizedCards, calendarPosts, trashedCards };
    });
  },
  purgeTrashedCard: (cardId) => {
    set((state) => {
      const trashedCards = pruneExpiredTrash(
        state.trashedCards.filter((item) => item.card.id !== cardId),
      );
      void persistState(state.cards, state.calendarPosts, trashedCards);
      return { trashedCards };
    });
  },
  moveCardPillar: (id, pilar) => {
    set((state) => {
      const cards = state.cards.map((card) =>
        card.id === id ? { ...card, pilar, updatedAt: nowIso() } : card,
      );
      void persistState(cards, state.calendarPosts, state.trashedCards);
      return { cards };
    });
  },
  markCardStatus: (id, status) => {
    set((state) => {
      const cards = state.cards.map((card) =>
        card.id === id ? { ...card, status, updatedAt: nowIso() } : card,
      );
      void persistState(cards, state.calendarPosts, state.trashedCards);
      return { cards };
    });
  },
  addCalendarPost: (input) => {
    const newPost: CalendarPost = {
      id: uuidv4(),
      ideaCardId: input.ideaCardId,
      titulo: input.titulo.trim(),
      dataInicio: input.dataInicio,
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
      void persistState(cards, calendarPosts, state.trashedCards);
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
              dataFim:
                updates.dataInicio !== undefined ? undefined : updates.dataFim ?? post.dataFim,
            }
          : post,
      );
      void persistState(state.cards, calendarPosts, state.trashedCards);
      return { calendarPosts };
    });
  },
  deleteCalendarPost: (id) => {
    set((state) => {
      const postToDelete = state.calendarPosts.find((post) => post.id === id);
      const calendarPosts = state.calendarPosts.filter((post) => post.id !== id);
      const cards = state.cards.map((card) => {
        if (card.id !== postToDelete?.ideaCardId) return card;

        const stillScheduled = calendarPosts.some(
          (post) => post.ideaCardId === card.id,
        );
        if (stillScheduled || card.status !== "Agendado") return card;

        return { ...card, status: "Criado" as const, updatedAt: nowIso() };
      });

      void persistState(cards, calendarPosts, state.trashedCards);
      return { cards, calendarPosts };
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
      void persistState(cards, calendarPosts, state.trashedCards);
      return { cards, calendarPosts };
    });

    return newPosts;
  },
}));
