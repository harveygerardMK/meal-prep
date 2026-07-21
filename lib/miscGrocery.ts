import "server-only";

import { randomUUID } from "crypto";
import { getWeekPlan, upsertWeekPlan } from "./dataStore";
import { weekStartISO } from "./week";
import { PlanNotFoundError } from "./planGenerator";
import {
  parseMiscGroceryName,
  parseMiscGroceryNote,
  parseMiscGrocerySection,
} from "./miscGroceryParse";
import type { MiscGroceryItem } from "./types";

export async function addMiscGroceryItem(input: {
  name: unknown;
  note?: unknown;
  section?: unknown;
}): Promise<MiscGroceryItem[]> {
  const weekOf = weekStartISO();
  const plan = await getWeekPlan(weekOf);
  if (!plan) throw new PlanNotFoundError(weekOf);

  const item: MiscGroceryItem = {
    id: randomUUID(),
    name: parseMiscGroceryName(input.name),
    note: parseMiscGroceryNote(input.note),
    section: parseMiscGrocerySection(input.section),
    addedAt: new Date().toISOString(),
  };

  const miscGrocery = [...(plan.miscGrocery ?? []), item];
  await upsertWeekPlan({ ...plan, miscGrocery });
  return miscGrocery;
}

export async function removeMiscGroceryItem(id: unknown): Promise<MiscGroceryItem[]> {
  if (typeof id !== "string" || id.length === 0) {
    throw new Error("Invalid id: expected a string");
  }
  const weekOf = weekStartISO();
  const plan = await getWeekPlan(weekOf);
  if (!plan) throw new PlanNotFoundError(weekOf);

  const miscGrocery = (plan.miscGrocery ?? []).filter((item) => item.id !== id);
  if (miscGrocery.length === (plan.miscGrocery ?? []).length) {
    throw new Error("Miscellaneous item not found");
  }
  await upsertWeekPlan({ ...plan, miscGrocery });
  return miscGrocery;
}
