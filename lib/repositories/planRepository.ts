import "server-only";

import { coerceDinnerSlots } from "@/lib/dinnerSlot";
import type { DinnerSlot, History, WeekPlan } from "@/lib/types";
import { getDocumentStore } from "./getDocumentStore";

/** Legacy weeks stored `dinners` as plain recipe id strings. */
function coerceWeek(week: WeekPlan): WeekPlan {
  return {
    ...week,
    dinners: coerceDinnerSlots(week.dinners as (DinnerSlot | string)[]),
  };
}

export async function getHistory(): Promise<History> {
  const store = await getDocumentStore();
  const history = await store.readJson<History>("history.json");
  return { weeks: history.weeks.map(coerceWeek) };
}

export async function saveHistory(history: History): Promise<void> {
  const store = await getDocumentStore();
  await store.writeJson("history.json", history);
}

export async function upsertWeekPlan(plan: WeekPlan): Promise<History> {
  const store = await getDocumentStore();
  return store.updateJson<History>("history.json", (history) => ({
    weeks: [...history.weeks.filter((w) => w.weekOf !== plan.weekOf), plan],
  }));
}

export async function getWeekPlan(weekOf: string): Promise<WeekPlan | null> {
  const history = await getHistory();
  return history.weeks.find((w) => w.weekOf === weekOf) ?? null;
}
