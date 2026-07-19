import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlan, PlanNotFoundError } from "@/lib/planGenerator";
import { groceryListFor } from "@/lib/groceryListFor.server";
import { addMiscGroceryItem, removeMiscGroceryItem } from "@/lib/miscGrocery";

function errorResponse(error: unknown, fallbackStatus = 500) {
  if (error instanceof PlanNotFoundError) {
    return NextResponse.json({ error: error.message, code: "NO_PLAN" }, { status: 404 });
  }
  const message = error instanceof Error ? error.message : "Unexpected error";
  const status =
    error instanceof Error && /invalid|not found/i.test(error.message) ? 400 : fallbackStatus;
  return NextResponse.json({ error: message }, { status });
}

async function groceryPayload() {
  const plan = await getCurrentPlan();
  return {
    weekOf: plan.weekOf,
    miscGrocery: plan.miscGrocery,
    groceryList: await groceryListFor(plan),
  };
}

export async function GET() {
  try {
    return NextResponse.json(await groceryPayload());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await addMiscGroceryItem({ name: body?.name, note: body?.note });
    return NextResponse.json(await groceryPayload());
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    await removeMiscGroceryItem(body?.id);
    return NextResponse.json(await groceryPayload());
  } catch (error) {
    return errorResponse(error);
  }
}
