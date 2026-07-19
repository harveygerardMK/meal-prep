import { NextRequest, NextResponse } from "next/server";
import { getSettings, saveSettings } from "@/lib/dataStore";
import type { Settings } from "@/lib/types";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const settings = (await req.json()) as Settings;
  await saveSettings(settings);
  return NextResponse.json(settings);
}
