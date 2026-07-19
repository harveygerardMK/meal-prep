import {
  getRecipes,
  getSettings,
  getHistory,
  upsertWeekPlan,
  getWeekPlan,
  listCatalogRecipes,
} from "./dataStore";
import { weekStartISO } from "./week";
import { pickDinners, pickLunch } from "./planSelection";
import { recipeToPlannerViews } from "./recipes/recipeValidation";
import type {
  Locks,
  WeekPlan,
  ResolvedWeekPlan,
  History,
} from "./types";

export class PlanNotFoundError extends Error {
  constructor(weekOf: string) {
    super(`No plan for week ${weekOf}`);
    this.name = "PlanNotFoundError";
  }
}

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
  await upsertWeekPlan(plan);
  return plan;
}

async function resolvePlan(plan: WeekPlan): Promise<ResolvedWeekPlan> {
  // Include archived recipes so historical plans still resolve after archive.
  const catalog = await listCatalogRecipes();
  const settings = await getSettings();
  const recipes = recipeToPlannerViews(catalog, settings.servings, {
    includeArchived: true,
  });
  const dinnerById = new Map(recipes.dinners.map((d) => [d.id, d]));
  const girlById = new Map(recipes.girlLunches.map((l) => [l.id, l]));
  const boyById = new Map(recipes.boyLunches.map((l) => [l.id, l]));

  const dinners = plan.dinners.map((id) => {
    const dinner = dinnerById.get(id);
    if (!dinner) {
      throw new Error(`Unknown dinner id in plan: ${id}`);
    }
    return dinner;
  });

  const girlLunch = girlById.get(plan.girlLunch);
  if (!girlLunch) {
    throw new Error(`Unknown girl lunch id in plan: ${plan.girlLunch}`);
  }
  const boyLunch = boyById.get(plan.boyLunch);
  if (!boyLunch) {
    throw new Error(`Unknown boy lunch id in plan: ${plan.boyLunch}`);
  }

  return {
    weekOf: plan.weekOf,
    dinners,
    girlLunch,
    boyLunch,
    locks: plan.locks,
  };
}

/** Read-only: never creates a plan. */
export async function getCurrentPlan(): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const existing = await getWeekPlan(weekOf);
  if (!existing) {
    throw new PlanNotFoundError(weekOf);
  }
  return resolvePlan(existing);
}

/** Explicit mutation: create this week's plan when missing. */
export async function ensureCurrentPlan(): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const existing = await getWeekPlan(weekOf);
  if (existing) {
    return resolvePlan(existing);
  }
  const settings = await getSettings();
  const plan = await buildPlan(weekOf, emptyLocks(settings.dinnersPerWeek));
  return resolvePlan(plan);
}

export async function regenerateCurrentPlan(locks: Locks): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const plan = await buildPlan(weekOf, locks);
  return resolvePlan(plan);
}
