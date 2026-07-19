import { randomUUID } from "crypto";
import {
  getRecipes,
  getSettings,
  getHistory,
  upsertWeekPlan,
  getWeekPlan,
  listCatalogRecipes,
} from "./dataStore";
import { customDinnerToDinner, dinnerSlotId } from "./dinnerSlot";
import { weekStartISO } from "./week";
import { pickDinners, pickLunch } from "./planSelection";
import { recipeToPlannerViews } from "./recipes/recipeValidation";
import {
  listPendingForWeek,
  markQueueConsumed,
} from "./repositories/queueRepository";
import type {
  CustomDinner,
  CustomDinnerInput,
  DinnerSlot,
  Locks,
  WeekPlan,
  ResolvedWeekPlan,
  History,
  WeekPreferences,
} from "./types";

export class PlanNotFoundError extends Error {
  constructor(weekOf: string) {
    super(`No plan for week ${weekOf}`);
    this.name = "PlanNotFoundError";
  }
}

export function withConfirmationDefaults(
  plan: WeekPlan
): WeekPlan & { confirmed: boolean } {
  return plan.confirmed ? { ...plan, confirmed: true } : clearConfirmation(plan);
}

export function markPlanConfirmed(plan: WeekPlan, confirmedAt: string): WeekPlan {
  return {
    ...plan,
    confirmed: true,
    confirmedAt,
  };
}

export function clearConfirmation(plan: WeekPlan): WeekPlan & { confirmed: false } {
  const { confirmedAt: _confirmedAt, ...unconfirmedPlan } = plan;
  return {
    ...unconfirmedPlan,
    confirmed: false,
  };
}

function recentWeeks(history: History, beforeWeekOf: string, count: number): WeekPlan[] {
  return history.weeks
    .filter((w) => w.weekOf < beforeWeekOf)
    .sort((a, b) => (a.weekOf < b.weekOf ? 1 : -1))
    .slice(0, count);
}

/** Only recipe slots enter the avoid-set — customs never repeat-block anything. */
export function recentDinnerIds(
  history: History,
  weekOf: string,
  noRepeatWeeks: number
): Set<string> {
  const ids = new Set<string>();
  for (const w of recentWeeks(history, weekOf, noRepeatWeeks)) {
    for (const slot of w.dinners) {
      if (slot.type === "recipe") ids.add(slot.recipeId);
    }
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

async function buildPlan(
  weekOf: string,
  locks: Locks,
  preferences: WeekPreferences,
  opts?: { avoidCurrentUnlocked?: boolean }
): Promise<WeekPlan> {
  const [recipes, settings, history] = await Promise.all([
    getRecipes(),
    getSettings(),
    getHistory(),
  ]);

  const avoidDinners = recentDinnerIds(history, weekOf, settings.noRepeatWeeks);
  const avoidGirl = recentLunchIds(history, weekOf, settings.noRepeatWeeks, "girlLunch");
  const avoidBoy = recentLunchIds(history, weekOf, settings.noRepeatWeeks, "boyLunch");

  // On regenerate, prefer not re-picking the unlocked meals already on this week.
  const existingWeek = history.weeks.find((w) => w.weekOf === weekOf);
  if (opts?.avoidCurrentUnlocked && existingWeek) {
    existingWeek.dinners.forEach((slot, index) => {
      if (slot.type === "recipe" && !locks.dinners[index]) {
        avoidDinners.add(slot.recipeId);
      }
    });
    if (!locks.girlLunch) avoidGirl.add(existingWeek.girlLunch);
    if (!locks.boyLunch) avoidBoy.add(existingWeek.boyLunch);
  }

  const queued = await listPendingForWeek(weekOf);
  const dinnerIds = pickDinners(
    recipes.dinners,
    settings.dinnersPerWeek,
    settings.maxCookMinutes,
    avoidDinners,
    locks.dinners,
    preferences,
    queued.map((item) => item.recipeId)
  );
  // A locked slot whose id still matches this week's existing custom slot keeps its
  // full custom data (name/ingredients/etc.); everything else resolves as a recipe id.
  const dinners: DinnerSlot[] = dinnerIds.map((id, index) => {
    const existingSlot = existingWeek?.dinners[index];
    if (existingSlot?.type === "custom" && existingSlot.custom.id === id) {
      return existingSlot;
    }
    return { type: "recipe", recipeId: id };
  });
  const girlLunch = pickLunch(recipes.girlLunches, avoidGirl, locks.girlLunch);
  const boyLunch = pickLunch(recipes.boyLunches, avoidBoy, locks.boyLunch);

  const plan = clearConfirmation({
    weekOf,
    dinners,
    girlLunch,
    boyLunch,
    locks,
    preferences,
    // Keep household extras across regenerate / rebuild.
    miscGrocery: existingWeek?.miscGrocery ?? [],
  });
  await upsertWeekPlan(plan);
  const consumed = queued
    .filter((item) => dinnerIds.includes(item.recipeId))
    .map((item) => item.id);
  await markQueueConsumed(consumed);
  return plan;
}

async function resolvePlan(plan: WeekPlan): Promise<ResolvedWeekPlan> {
  const normalizedPlan = withConfirmationDefaults(plan);
  // Include archived recipes so historical plans still resolve after archive.
  const catalog = await listCatalogRecipes();
  const settings = await getSettings();
  const recipes = recipeToPlannerViews(catalog, settings.servings, {
    includeArchived: true,
  });
  const dinnerById = new Map(recipes.dinners.map((d) => [d.id, d]));
  const girlById = new Map(recipes.girlLunches.map((l) => [l.id, l]));
  const boyById = new Map(recipes.boyLunches.map((l) => [l.id, l]));

  const dinners = normalizedPlan.dinners.map((slot) => {
    if (slot.type === "custom") {
      return customDinnerToDinner(slot.custom);
    }
    const dinner = dinnerById.get(slot.recipeId);
    if (!dinner) {
      throw new Error(`Unknown dinner id in plan: ${slot.recipeId}`);
    }
    return dinner;
  });

  const girlLunch = girlById.get(normalizedPlan.girlLunch);
  if (!girlLunch) {
    throw new Error(`Unknown girl lunch id in plan: ${plan.girlLunch}`);
  }
  const boyLunch = boyById.get(normalizedPlan.boyLunch);
  if (!boyLunch) {
    throw new Error(`Unknown boy lunch id in plan: ${plan.boyLunch}`);
  }

  return {
    weekOf: normalizedPlan.weekOf,
    dinners,
    girlLunch,
    boyLunch,
    locks: normalizedPlan.locks,
    preferences: normalizedPlan.preferences ?? {
      cookEffortTarget: settings.cookEffortTarget,
      noveltyTarget: settings.noveltyTarget,
    },
    miscGrocery: normalizedPlan.miscGrocery ?? [],
    confirmed: normalizedPlan.confirmed,
    ...(normalizedPlan.confirmedAt
      ? { confirmedAt: normalizedPlan.confirmedAt }
      : {}),
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
export async function ensureCurrentPlan(
  preferences?: WeekPreferences
): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const existing = await getWeekPlan(weekOf);
  if (existing) {
    return resolvePlan(existing);
  }
  const settings = await getSettings();
  const prefs = preferences ?? {
    cookEffortTarget: settings.cookEffortTarget,
    noveltyTarget: settings.noveltyTarget,
  };
  const plan = await buildPlan(
    weekOf,
    emptyLocks(settings.dinnersPerWeek),
    prefs
  );
  return resolvePlan(plan);
}

export async function regenerateCurrentPlan(
  locks: Locks,
  preferences?: WeekPreferences
): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const settings = await getSettings();
  const prefs = preferences ?? {
    cookEffortTarget: settings.cookEffortTarget,
    noveltyTarget: settings.noveltyTarget,
  };
  const plan = await buildPlan(weekOf, locks, prefs, {
    avoidCurrentUnlocked: true,
  });
  return resolvePlan(plan);
}

/** Explicit mutation: mark this week's plan as reviewed and finalized. */
export async function confirmCurrentPlan(): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const existing = await getWeekPlan(weekOf);
  if (!existing) {
    throw new PlanNotFoundError(weekOf);
  }
  const confirmed = markPlanConfirmed(existing, new Date().toISOString());
  await upsertWeekPlan(confirmed);
  return resolvePlan(confirmed);
}

/**
 * Explicit mutation: type in an ad hoc dinner for a slot and lock it.
 * Customs are never written to the recipe catalog and never enter the avoid-set.
 */
export async function setCustomDinnerForCurrentWeek(
  input: CustomDinnerInput
): Promise<ResolvedWeekPlan> {
  const weekOf = weekStartISO();
  const existing = await getWeekPlan(weekOf);
  if (!existing) {
    throw new PlanNotFoundError(weekOf);
  }
  if (input.index < 0 || input.index >= existing.dinners.length) {
    throw new Error(`Invalid index: dinner slot ${input.index} does not exist`);
  }

  const custom: CustomDinner = {
    id: `custom:${randomUUID()}`,
    name: input.name,
    ingredients: input.ingredients,
    ...(input.cookMinutes !== undefined ? { cookMinutes: input.cookMinutes } : {}),
    ...(input.protein !== undefined ? { protein: input.protein } : {}),
  };
  const customSlot: DinnerSlot = { type: "custom", custom };

  const dinners = existing.dinners.map((slot, i) => (i === input.index ? customSlot : slot));
  const dinnerLocks = existing.locks.dinners.map((lockId, i) =>
    i === input.index ? dinnerSlotId(customSlot) : lockId
  );

  const plan = clearConfirmation({
    ...existing,
    dinners,
    locks: { ...existing.locks, dinners: dinnerLocks },
  });
  await upsertWeekPlan(plan);
  return resolvePlan(plan);
}
