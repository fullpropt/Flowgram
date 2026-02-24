import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildInitialIdeaCards } from "@/data/seed";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { CalendarPost, IdeaCard, TrashedIdeaCard } from "@/types/models";

function unauthorized() {
  return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
}

function isMissingTrashTableError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

function mapCardFromDb(card: {
  id: string;
  titulo: string;
  descricao: string | null;
  pilar: string | null;
  camadas: Prisma.JsonValue;
  status: string;
  tags: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): IdeaCard {
  return {
    id: card.id,
    titulo: card.titulo,
    descricao: card.descricao ?? undefined,
    pilar: (card.pilar ?? undefined) as IdeaCard["pilar"],
    camadas: (card.camadas ?? {}) as IdeaCard["camadas"],
    status: card.status as IdeaCard["status"],
    tags: Array.isArray(card.tags) ? (card.tags as string[]) : [],
    createdAt: card.createdAt.toISOString(),
    updatedAt: card.updatedAt.toISOString(),
  };
}

function mapPostFromDb(post: {
  id: string;
  ideaCardId: string | null;
  titulo: string;
  dataInicio: Date;
  dataFim: Date | null;
  canal: string;
  observacoes: string | null;
}): CalendarPost {
  return {
    id: post.id,
    ideaCardId: post.ideaCardId ?? undefined,
    titulo: post.titulo,
    dataInicio: post.dataInicio.toISOString(),
    dataFim: post.dataFim?.toISOString(),
    canal: post.canal as CalendarPost["canal"],
    observacoes: post.observacoes ?? undefined,
  };
}

function mapTrashedCardFromDb(record: {
  id: string;
  card: Prisma.JsonValue;
  relatedPosts: Prisma.JsonValue;
  deletedAt: Date;
  expiresAt: Date;
}): TrashedIdeaCard | null {
  const card =
    record.card && typeof record.card === "object"
      ? (record.card as unknown as IdeaCard)
      : null;

  if (!card || !card.id || !card.titulo) return null;

  const relatedCalendarPosts = Array.isArray(record.relatedPosts)
    ? (record.relatedPosts as unknown as CalendarPost[])
    : [];

  return {
    card,
    relatedCalendarPosts,
    deletedAt: record.deletedAt.toISOString(),
    expiresAt: record.expiresAt.toISOString(),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  let cardsDb = await prisma.ideaCard.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (cardsDb.length === 0) {
    const seedCards = buildInitialIdeaCards();
    await prisma.ideaCard.createMany({
      data: seedCards.map((card) => ({
        id: card.id,
        userId,
        titulo: card.titulo,
        descricao: card.descricao ?? null,
        pilar: card.pilar ?? null,
        camadas: card.camadas as Prisma.InputJsonValue,
        status: card.status,
        tags: card.tags as Prisma.InputJsonValue,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
      })),
    });

    cardsDb = await prisma.ideaCard.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  const postsDb = await prisma.calendarPost.findMany({
    where: { userId },
    orderBy: { dataInicio: "asc" },
  });

  const now = new Date();
  let trashedCardsDb: Array<{
    id: string;
    card: Prisma.JsonValue;
    relatedPosts: Prisma.JsonValue;
    deletedAt: Date;
    expiresAt: Date;
  }> = [];

  try {
    await prisma.trashedIdeaCard.deleteMany({
      where: { userId, expiresAt: { lte: now } },
    });

    trashedCardsDb = await prisma.trashedIdeaCard.findMany({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { deletedAt: "desc" },
    });
  } catch (error) {
    if (!isMissingTrashTableError(error)) throw error;
    console.warn("Tabela TrashedIdeaCard ainda nao existe. Retornando lixeira vazia.");
  }

  return NextResponse.json({
    cards: cardsDb.map(mapCardFromDb),
    calendarPosts: postsDb.map(mapPostFromDb),
    trashedCards: trashedCardsDb
      .map(mapTrashedCardFromDb)
      .filter((item): item is TrashedIdeaCard => item !== null),
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const body = (await request.json()) as {
    cards?: IdeaCard[];
    calendarPosts?: CalendarPost[];
    trashedCards?: TrashedIdeaCard[];
  };

  const cards = Array.isArray(body.cards) ? body.cards : [];
  const calendarPosts = Array.isArray(body.calendarPosts) ? body.calendarPosts : [];
  const trashedCards = Array.isArray(body.trashedCards) ? body.trashedCards : [];

  try {
    await prisma.$transaction([
      prisma.calendarPost.deleteMany({ where: { userId } }),
      prisma.trashedIdeaCard.deleteMany({ where: { userId } }),
      prisma.ideaCard.deleteMany({ where: { userId } }),
      prisma.ideaCard.createMany({
        data: cards.map((card) => ({
          id: card.id,
          userId,
          titulo: card.titulo,
          descricao: card.descricao ?? null,
          pilar: card.pilar ?? null,
          camadas: card.camadas as Prisma.InputJsonValue,
          status: card.status,
          tags: card.tags as Prisma.InputJsonValue,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
        })),
      }),
      prisma.calendarPost.createMany({
        data: calendarPosts.map((post) => ({
          id: post.id,
          userId,
          ideaCardId: post.ideaCardId ?? null,
          titulo: post.titulo,
          dataInicio: new Date(post.dataInicio),
          dataFim: post.dataFim ? new Date(post.dataFim) : null,
          canal: post.canal,
          observacoes: post.observacoes ?? null,
        })),
      }),
      prisma.trashedIdeaCard.createMany({
        data: trashedCards.map((item) => ({
          id: item.card.id,
          userId,
          card: item.card as unknown as Prisma.InputJsonValue,
          relatedPosts: item.relatedCalendarPosts as unknown as Prisma.InputJsonValue,
          deletedAt: new Date(item.deletedAt),
          expiresAt: new Date(item.expiresAt),
        })),
      }),
    ]);
  } catch (error) {
    if (!isMissingTrashTableError(error)) throw error;

    console.warn("Tabela TrashedIdeaCard ainda nao existe. Salvando sem lixeira.");
    await prisma.$transaction([
      prisma.calendarPost.deleteMany({ where: { userId } }),
      prisma.ideaCard.deleteMany({ where: { userId } }),
      prisma.ideaCard.createMany({
        data: cards.map((card) => ({
          id: card.id,
          userId,
          titulo: card.titulo,
          descricao: card.descricao ?? null,
          pilar: card.pilar ?? null,
          camadas: card.camadas as Prisma.InputJsonValue,
          status: card.status,
          tags: card.tags as Prisma.InputJsonValue,
          createdAt: new Date(card.createdAt),
          updatedAt: new Date(card.updatedAt),
        })),
      }),
      prisma.calendarPost.createMany({
        data: calendarPosts.map((post) => ({
          id: post.id,
          userId,
          ideaCardId: post.ideaCardId ?? null,
          titulo: post.titulo,
          dataInicio: new Date(post.dataInicio),
          dataFim: post.dataFim ? new Date(post.dataFim) : null,
          canal: post.canal,
          observacoes: post.observacoes ?? null,
        })),
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}
