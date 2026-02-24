import { CalendarPost, IdeaCard, TrashedIdeaCard } from "@/types/models";

interface AppStateResponse {
  cards: IdeaCard[];
  calendarPosts: CalendarPost[];
  trashedCards: TrashedIdeaCard[];
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`Falha na requisicao: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function loadAppState(): Promise<AppStateResponse> {
  const response = await fetch("/api/state", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  return parseResponse<AppStateResponse>(response);
}

export async function saveAppState(
  cards: IdeaCard[],
  calendarPosts: CalendarPost[],
  trashedCards: TrashedIdeaCard[],
): Promise<void> {
  const response = await fetch("/api/state", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cards, calendarPosts, trashedCards }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao persistir estado: ${response.status}`);
  }
}
