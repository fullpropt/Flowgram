import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getStudioAssetsSummary } from "@/lib/studio-assets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return unauthorized();

  const summary = await getStudioAssetsSummary(userId);
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
