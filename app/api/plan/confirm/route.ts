import { NextResponse } from "next/server";
import {
  confirmCurrentPlan,
  PlanNotFoundError,
} from "@/lib/planGenerator";
import { groceryListFor } from "@/lib/groceryListFor.server";

function errorResponse(error: unknown) {
  if (error instanceof PlanNotFoundError) {
    return NextResponse.json({ error: error.message, code: "NO_PLAN" }, { status: 404 });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST() {
  try {
    const plan = await confirmCurrentPlan();
    const groceryList = await groceryListFor(plan);
    return NextResponse.json({ plan, groceryList });
  } catch (error) {
    return errorResponse(error);
  }
}
