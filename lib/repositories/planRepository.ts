import "server-only";

import path from "path";
import type { History, WeekPlan } from "@/lib/types";
import { AtomicJsonStore } from "./atomicJsonStore";

const store = new AtomicJsonStore(path.join(process.cwd(), "data"));

export async function getHistory(): Promise<History> {
  return store.readJson<History>("history.json");
}

export async function saveHistory(history: History): Promise<void> {
  await store.writeJson("history.json", history);
}

export async function upsertWeekPlan(plan: WeekPlan): Promise<History> {
  return store.updateJson<History>("history.json", (history) => ({
    weeks: [...history.weeks.filter((w) => w.weekOf !== plan.weekOf), plan],
  }));
}

export async function getWeekPlan(weekOf: string): Promise<WeekPlan | null> {
  const history = await getHistory();
  return history.weeks.find((w) => w.weekOf === weekOf) ?? null;
}
