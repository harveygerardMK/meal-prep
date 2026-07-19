import "server-only";

import { getSettings, getStaples } from "@/lib/dataStore";
import { buildGroceryList } from "@/lib/groceryList";
import type { ResolvedWeekPlan } from "@/lib/types";

export async function groceryListFor(plan: ResolvedWeekPlan) {
  const [settings, staples] = await Promise.all([getSettings(), getStaples()]);
  return buildGroceryList(plan, {
    includeStaples: settings.includeStaplesInGroceryList,
    staples: staples.items,
  });
}
