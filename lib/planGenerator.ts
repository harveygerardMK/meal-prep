import { getRecipes, getSettings, getHistory, saveHistory } from "./dataStore";
import { weekStartISO } from "./week";
import type {
  Dinner,
  LunchOption,
  Locks,
  WeekPlan,
  ResolvedWeekPlan,
  History,
} from "./types";

function recentWeeks(history: History, beforeWeekOf: string, count: number): WeekPlan[] {
  return history.weeks
    .filter((w) => w.weekOf < beforeWeekOf)
    .sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1))
    .slice(0, count);
}

function recentDinnerIds(history: History, weekOf: string, noRepeatWeeks: number): Set<string> {
  const ids = new Set<string>();
  for (const w of recentWeeks(history, weekOf, noRepeatWeeks)) {
    for (const id of w.dinners) ids.add(id);
  }
  return ids;
}

function recentLunchIds(
  history: History,
  weekOf: string,
  noRepeatWeeks: number,
  field: "girlLunch" | "boyLunch"
): Set<string> {
  const ids = new Set<string>();
  for (const w of recentWeeks(history, weekOf, noRepeatWeeks)) {
    ids.add(w[field]);
  }
  return ids;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickDinners(
  allDinners: Dinner[],
  count: number,
  maxCookMinutes: number,
  avoidIds: Set<string>,
  locked: (string | null)[]
): string[] {
  const result: string[] = locked.slice(0, count).map((id) => id ?? "");
  while (result.length < count) result.push("");

  const usedProteins = new Set<string>();
  const usedIds = new Set<string>();
  for (const id of result) {
    if (!id) continue;
    const d = allDinners.find((x) => x.id === id);
    if (d) {
      usedProteins.add(d.protein);
      usedIds.add(d.id);
    }
  }

  const withinTime = allDinners.filter((d) => d.cookMinutes <= maxCookMinutes);
  const fresh = shuffle(withinTime.filter((d) => !avoidIds.has(d.id) && !usedIds.has(d.id)));
  const fallback = shuffle(withinTime.filter((d) => !usedIds.has(d.id)));

  for (let i = 0; i < count; i++) {
    if (result[i]) continue;

    const choice =
      fresh.find((d) => !usedProteins.has(d.protein)) ??
      fresh[0] ??
      fallback.find((d) => !usedProteins.has(d.protein)) ??
      fallback[0];

    if (!choice) continue;

    result[i] = choice.id;
    usedProteins.add(choice.protein);
    usedIds.add(choice.id);

    const removeFrom = (list: Dinner[]) => {
      const idx = list.findIndex((d) => d.id === choice!.id);
      if (idx >= 0) list.splice(idx, 1);
    };
    removeFrom(fresh);
    removeFrom(fallback);
  }

  return result;
}

function pickLunch(options: LunchOption[], avoidIds: Set<string>, locked: string | null): string {
  if (locked) return locked;
  const fresh = options.filter((o) => !avoidIds.has(o.id));
  const pool = fresh.length > 0 ? fresh : options;
  return pool[Math.floor(Math.random() * pool.length)].id;
}

function emptyLocks(dinnersPerWeek: number): Locks {
  return {
    dinners: Array(dinnersPerWeek).fill(null),
    girlLunch: null,
    boyLunch: null,
  };
}

async function buildPlan(weekOf: string, locks: Locks): Promise<WeekPlan> {
  const [recipes, settings, history] = await Promise.all([
    getRecipes(),
    getSettings(),
    getHistory(),
  ]);

  const avoidDinners = recentDinnerIds(history, weekOf, settings.noRepeatWeeks);
  const avoidGirl = recentLunchIds(history, weekOf, settings.noRepeatWeeks, "girlLunch");
  const avoidBoy = recentLunchIds(history, weekOf, settings.noRepeatWeeks, "boyLunch");

  const dinners = pickDinners(
    recipes.dinners,
    settings.dinnersPerWeek,
    settings.maxCookMinutes,
    avoidDinners,
    locks.dinners
  );
  const girlLunch = pickLunch(recipes.girlLunches, avoidGirl, locks.girlLunch);
  const boyLunch = pickLunch(recipes.boyLunches, avoidBoy, locks.boyLunch);

  const plan: WeekPlan = { weekOf, dinners, girlLunch, boyLunch, locks };

  const otherWeeks = history.weeks.filter((w) => w.weekOf !== weekOf);
  await saveHistory({ weeks: [...otherWeeks, plan] });

  return plan;
}

async function resolvePlan(plan: WeekPlan): Promise<ResolvedWeekPlan> {
  const recipes = await getRecipes();
  const dinnerById = new Map(recipes.dinners.map((d) => [d.id, d]));
  const girlById = new Map(recipes.girlLunches.map((l) => [l.id, l]));
  const boyById = new Map(recipes.boyLunches.map((l) => [l.id, l]));

  return {
    weekOf: plan.weekOf,
    dinners: plan.dinners.map((id) => dinnerById.get(id)!).filter(Boolean),
    girlLunch: girlById.get(plan.girlLunch)!,
    boyLunch: boyById.get(plan.boyLunch)!,
    locks: plan.locks,
  };
}

export async function getCurrentPlan(): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const history = await getHistory();
  const existing = history.weeks.find((w) => w.weekOf === weekOf);
  if (existing) return resolvePlan(existing);

  const settings = await getSettings();
  const plan = await buildPlan(weekOf, emptyLocks(settings.dinnersPerWeek));
  return resolvePlan(plan);
}

export async function regenerateCurrentPlan(locks: Locks): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const plan = await buildPlan(weekOf, locks);
  return resolvePlan(plan);
}
