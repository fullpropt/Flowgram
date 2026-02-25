import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { readStudioLogoFile, removeStudioLogo, saveStudioLogo } from "@/lib/studio-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { message: "Nao autorizado." },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Vary: "Cookie",
      },
    },
  );
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    { message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Vary: "Cookie",
      },
    },
  );
}

function sanitizeHeaderFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const logo = await readStudioLogoFile(userId);
  if (!logo) {
    return jsonError("Logo nao encontrada.", 404);
  }

  return new NextResponse(logo.buffer, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Vary: "Cookie",
      "Content-Length": String(logo.size),
      "Content-Type": logo.mimeType,
      "Content-Disposition": `inline; filename="${sanitizeHeaderFileName(logo.fileName)}"`,
    },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Envie a logo no campo 'file'.");
    }

    const summary = await saveStudioLogo(userId, file);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao enviar logo.", 400);
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  try {
    const summary = await removeStudioLogo(userId);
    return NextResponse.json(summary, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Falha ao remover logo.", 400);
  }
}
