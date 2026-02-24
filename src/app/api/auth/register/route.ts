import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RegisterPayload {
  nome?: string;
  email?: string;
  senha?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as RegisterPayload;
  const nome = body.nome?.trim();
  const email = body.email?.trim().toLowerCase();
  const senha = body.senha;

  if (!email || !senha) {
    return NextResponse.json(
      { message: "Email e senha sao obrigatorios." },
      { status: 400 },
    );
  }

  if (senha.length < 6) {
    return NextResponse.json(
      { message: "A senha precisa ter pelo menos 6 caracteres." },
      { status: 400 },
    );
  }

  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (exists) {
    return NextResponse.json(
      { message: "Este email ja esta cadastrado." },
      { status: 409 },
    );
  }

  const passwordHash = await hash(senha, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: nome || email.split("@")[0],
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
