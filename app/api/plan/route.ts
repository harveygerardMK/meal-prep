import { NextRequest, NextResponse } from "next/server";
import {
  ensureCurrentPlan,
  getCurrentPlan,
  PlanNotFoundError,
  regenerateCurrentPlan,
  setCustomDinnerForCurrentWeek,
} from "@/lib/planGenerator";
import { groceryListFor } from "@/lib/groceryListFor.server";
import {
  parseCustomDinnerInput,
  parseLocks,
  parseWeekPreferences,
} from "@/lib/validation";
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
    const groceryList = await groceryListFor(plan);
    return NextResponse.json({ plan, groceryList });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action =
      body?.action === "ensure"
        ? "ensure"
        : body?.action === "setCustomDinner"
          ? "setCustomDinner"
          : "regenerate";

    if (action === "setCustomDinner") {
      const plan = await setCustomDinnerForCurrentWeek(
        parseCustomDinnerInput(body)
      );
      const groceryList = await groceryListFor(plan);
      return NextResponse.json({ plan, groceryList });
    }

    const settings = await getSettings();
    const preferences = parseWeekPreferences(body?.preferences, {
      cookEffortTarget: settings.cookEffortTarget,
      noveltyTarget: settings.noveltyTarget,
    });

    if (action === "ensure") {
      const plan = await ensureCurrentPlan(preferences);
      const groceryList = await groceryListFor(plan);
      return NextResponse.json({ plan, groceryList });
    }

    const locks = parseLocks(body?.locks);
    const plan = await regenerateCurrentPlan(locks, preferences);
    const groceryList = await groceryListFor(plan);
    return NextResponse.json({ plan, groceryList });
  } catch (error) {
    return errorResponse(error);
  }
}
