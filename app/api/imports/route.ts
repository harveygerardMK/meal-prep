import { NextRequest, NextResponse } from "next/server";
import { createTikTokImport } from "@/lib/imports/importService";
import { listImports } from "@/lib/repositories/importRepository";
import type { MealKind } from "@/lib/types";

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid|only tiktok/i.test(error.message)
      ? 400
      : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const imports = await listImports();
    return NextResponse.json({ imports });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (!url) throw new Error("Invalid url");
    const notes = typeof body?.notes === "string" ? body.notes : undefined;
    const kind = (body?.kind as MealKind | undefined) ?? "dinner";
    const item = await createTikTokImport({ url, notes, kind });
    return NextResponse.json({ import: item }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
