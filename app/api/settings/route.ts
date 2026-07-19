import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/dataStore";
import { parseSettings } from "@/lib/validation";

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid/i.test(error.message) ? 400 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = parseSettings(body);
    await saveSettings(settings);
    return NextResponse.json(settings);
  } catch (error) {
    return errorResponse(error);
  }
}
