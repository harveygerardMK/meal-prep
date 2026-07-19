import { NextRequest, NextResponse } from "next/server";
import { getStaples, saveStaples } from "@/lib/dataStore";
import { parseStaples } from "@/lib/validation";

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid/i.test(error.message) ? 400 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    return NextResponse.json(await getStaples());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const staples = parseStaples(await req.json());
    await saveStaples(staples);
    return NextResponse.json(staples);
  } catch (error) {
    return errorResponse(error);
  }
}
