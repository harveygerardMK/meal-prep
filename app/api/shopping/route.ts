import { NextResponse } from "next/server";
import { getCurrentPlan, PlanNotFoundError } from "@/lib/planGenerator";
import { groceryListFor } from "@/lib/groceryListFor.server";
import {
  buildShoppingHandoff,
  getInstacartConfig,
} from "@/lib/shopping/handoff";
import { createInstacartProductsLink } from "@/lib/integrations/instacart/client.server";

export async function GET() {
  try {
    const plan = await getCurrentPlan();
    const groceryList = await groceryListFor(plan);
    const config = getInstacartConfig();
    const handoff = buildShoppingHandoff(groceryList, config);

    let instacartLandingUrl: string | null = null;
    if (handoff.mode === "instacart_landing") {
      const link = await createInstacartProductsLink({
        title: `Meal prep ${plan.weekOf}`,
        lineItems: handoff.items.map((item) => ({ name: item.name })),
      });
      instacartLandingUrl = link?.url ?? null;
    }

    return NextResponse.json({
      weekOf: plan.weekOf,
      groceryList,
      handoff,
      instacartLandingUrl,
    });
  } catch (error) {
    if (error instanceof PlanNotFoundError) {
      return NextResponse.json(
        { error: error.message, code: "NO_PLAN" },
        { status: 404 }
      );
    }
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
