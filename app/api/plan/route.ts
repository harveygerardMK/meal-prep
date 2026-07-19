import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlan, regenerateCurrentPlan } from "@/lib/planGenerator";
import { buildGroceryList } from "@/lib/groceryList";
import { parseLocks } from "@/lib/validation";

function errorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid/i.test(error.message) ? 400 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    const plan = await getCurrentPlan();
    const groceryList = buildGroceryList(plan);
    return NextResponse.json({ plan, groceryList });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const locks = parseLocks(body?.locks);
    const plan = await regenerateCurrentPlan(locks);
    const groceryList = buildGroceryList(plan);
    return NextResponse.json({ plan, groceryList });
  } catch (error) {
    return errorResponse(error);
  }
}
