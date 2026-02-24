import { CalendarPost, IdeaCard } from "@/types/models";

const STORAGE_KEYS = {
  cards: "flowgram.ideaCards",
  calendarPosts: "flowgram.calendarPosts",
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadIdeaCards(): IdeaCard[] {
  if (!isBrowser()) return [];
  return safeParse<IdeaCard[]>(localStorage.getItem(STORAGE_KEYS.cards), []);
}

export function saveIdeaCards(cards: IdeaCard[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
}

export function loadCalendarPosts(): CalendarPost[] {
  if (!isBrowser()) return [];
  return safeParse<CalendarPost[]>(
    localStorage.getItem(STORAGE_KEYS.calendarPosts),
    [],
  );
}

export function saveCalendarPosts(posts: CalendarPost[]) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEYS.calendarPosts, JSON.stringify(posts));
}
