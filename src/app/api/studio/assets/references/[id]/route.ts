import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { deleteStudioReferenceFile, readStudioReferenceFile } from "@/lib/studio-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

function unauthorized() {
  return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

function sanitizeHeaderFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function getUserAndParamId(context: RouteContext) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const { id } = await Promise.resolve(context.params);
  return { userId, id };
}

export async function GET(_request: Request, context: RouteContext) {
  const { userId, id } = await getUserAndParamId(context);
  if (!userId) return unauthorized();

  const file = await readStudioReferenceFile(userId, id);
  if (!file) return jsonError("Arquivo de referencia nao encontrado.", 404);

  return new NextResponse(file.buffer, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Length": String(file.size),
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(file.fileName)}"`,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId, id } = await getUserAndParamId(context);
  if (!userId) return unauthorized();

  try {
    const summary = await deleteStudioReferenceFile(userId, id);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao remover arquivo.";
    const status = /nao encontrado/i.test(message) ? 404 : 400;
    return jsonError(message, status);
  }
}

export async function HEAD(_request: Request, context: RouteContext) {
  const { userId, id } = await getUserAndParamId(context);
  if (!userId) return new NextResponse(null, { status: 401 });

  const file = await readStudioReferenceFile(userId, id);
  if (!file) return new NextResponse(null, { status: 404 });

  return new NextResponse(null, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Length": String(file.size),
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(file.fileName)}"`,
    },
  });
}
