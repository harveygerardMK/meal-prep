import { NextRequest, NextResponse } from "next/server";
import {
  ensureCurrentPlan,
  getCurrentPlan,
  PlanNotFoundError,
  regenerateCurrentPlan,
} from "@/lib/planGenerator";
import { buildGroceryList } from "@/lib/groceryList";
import { parseLocks, parseWeekPreferences } from "@/lib/validation";
import { getSettings } from "@/lib/dataStore";

function errorResponse(error: unknown, fallbackStatus = 500) {
  if (error instanceof PlanNotFoundError) {
    return NextResponse.json({ error: error.message, code: "NO_PLAN" }, { status: 404 });
  }
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
    const action = body?.action === "ensure" ? "ensure" : "regenerate";
    const settings = await getSettings();
    const preferences = parseWeekPreferences(body?.preferences, {
      cookEffortTarget: settings.cookEffortTarget,
      noveltyTarget: settings.noveltyTarget,
    });

    if (action === "ensure") {
      const plan = await ensureCurrentPlan(preferences);
      const groceryList = buildGroceryList(plan);
      return NextResponse.json({ plan, groceryList });
    }

    const locks = parseLocks(body?.locks);
    const plan = await regenerateCurrentPlan(locks, preferences);
    const groceryList = buildGroceryList(plan);
    return NextResponse.json({ plan, groceryList });
  } catch (error) {
    return errorResponse(error);
  }
}
