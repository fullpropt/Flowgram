import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { buildInitialIdeaCards } from "@/data/seed";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { CalendarPost, IdeaCard } from "@/types/models";

function unauthorized() {
  return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
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

  return NextResponse.json({
    cards: cardsDb.map(mapCardFromDb),
    calendarPosts: postsDb.map(mapPostFromDb),
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const body = (await request.json()) as {
    cards?: IdeaCard[];
    calendarPosts?: CalendarPost[];
  };

  const cards = Array.isArray(body.cards) ? body.cards : [];
  const calendarPosts = Array.isArray(body.calendarPosts) ? body.calendarPosts : [];

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

  return NextResponse.json({ ok: true });
}
