import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlan, regenerateCurrentPlan } from "@/lib/planGenerator";
import { buildGroceryList } from "@/lib/groceryList";
import type { Locks } from "@/lib/types";

export async function GET() {
  const plan = await getCurrentPlan();
  const groceryList = buildGroceryList(plan);
  return NextResponse.json({ plan, groceryList });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { locks: Locks };
  const plan = await regenerateCurrentPlan(body.locks);
  const groceryList = buildGroceryList(plan);
  return NextResponse.json({ plan, groceryList });
}
