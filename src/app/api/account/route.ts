import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

function unauthorized() {
  return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Usuario nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    name: user.name ?? "",
    email: user.email,
  });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const body = (await request.json()) as {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  const nextName = body.name?.trim() ?? "";
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, passwordHash: true },
  });

  if (!user) {
    return NextResponse.json({ message: "Usuario nao encontrado." }, { status: 404 });
  }

  if (!nextName) {
    return NextResponse.json({ message: "Nome nao pode ficar vazio." }, { status: 400 });
  }

  const wantsPasswordChange = Boolean(newPassword.trim());
  if (wantsPasswordChange) {
    if (!currentPassword) {
      return NextResponse.json({ message: "Informe a senha atual." }, { status: 400 });
    }

    const currentMatches = await compare(currentPassword, user.passwordHash);
    if (!currentMatches) {
      return NextResponse.json({ message: "Senha atual invalida." }, { status: 400 });
    }

    if (newPassword.trim().length < 6) {
      return NextResponse.json(
        { message: "Nova senha deve ter pelo menos 6 caracteres." },
        { status: 400 },
      );
    }
  }

  const data: {
    name?: string;
    passwordHash?: string;
  } = {};

  if (nextName !== (user.name ?? "")) {
    data.name = nextName;
  }

  if (wantsPasswordChange) {
    data.passwordHash = await hash(newPassword.trim(), 12);
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  return NextResponse.json({
    ok: true,
    name: data.name ?? user.name ?? "",
    email: user.email,
    passwordChanged: wantsPasswordChange,
  });
}

