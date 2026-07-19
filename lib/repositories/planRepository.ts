import "server-only";

import type { History, WeekPlan } from "@/lib/types";
import { getDocumentStore } from "./getDocumentStore";

export async function getHistory(): Promise<History> {
  const store = await getDocumentStore();
  return store.readJson<History>("history.json");
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
