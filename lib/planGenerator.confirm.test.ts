import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  CatalogRecipe,
  RecipeData,
  Settings,
  WeekPlan,
} from "./types";

vi.mock("./dataStore", () => ({
  getRecipes: vi.fn(),
  getSettings: vi.fn(),
  getHistory: vi.fn(),
  upsertWeekPlan: vi.fn(),
  getWeekPlan: vi.fn(),
  listCatalogRecipes: vi.fn(),
}));

vi.mock("./repositories/queueRepository", () => ({
  listPendingForWeek: vi.fn(),
  markQueueConsumed: vi.fn(),
}));

import {
  getHistory,
  getRecipes,
  getSettings,
  getWeekPlan,
  listCatalogRecipes,
  upsertWeekPlan,
} from "./dataStore";
import { confirmCurrentPlan, regenerateCurrentPlan } from "./planGenerator";
import { listPendingForWeek } from "./repositories/queueRepository";

const settings: Settings = {
  dinnersPerWeek: 1,
  maxCookMinutes: 30,
  noRepeatWeeks: 2,
  servings: 2,
  cookEffortTarget: 3,
  noveltyTarget: 3,
  includeStaplesInGroceryList: true,
};

const plan: WeekPlan = {
  weekOf: "2026-07-13",
  dinners: [{ type: "recipe", recipeId: "dinner-1" }],
  girlLunch: "girl-lunch-1",
  boyLunch: "boy-lunch-1",
  locks: { dinners: [null], girlLunch: null, boyLunch: null },
};

const recipes: RecipeData = {
  servings: 2,
  dinners: [
    {
      id: "dinner-1",
      name: "Dinner",
      protein: "chicken",
      cookMinutes: 20,
      tags: [],
      ingredients: [],
    },
  ],
  girlLunches: [{ id: "girl-lunch-1", name: "Girl lunch", ingredients: [] }],
  boyLunches: [{ id: "boy-lunch-1", name: "Boy lunch", ingredients: [] }],
};

const catalog: CatalogRecipe[] = [
  {
    id: "dinner-1",
    kind: "dinner",
    name: "Dinner",
    protein: "chicken",
    cookMinutes: 20,
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  },
  {
    id: "girl-lunch-1",
    kind: "girl_lunch",
    name: "Girl lunch",
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  },
  {
    id: "boy-lunch-1",
    kind: "boy_lunch",
    name: "Boy lunch",
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  },
];

describe("confirmCurrentPlan", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-19T18:00:00.000Z"));
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(getWeekPlan).mockResolvedValue(plan);
    vi.mocked(listCatalogRecipes).mockResolvedValue(catalog);
    vi.mocked(upsertWeekPlan).mockResolvedValue({ weeks: [plan] });
    vi.mocked(getRecipes).mockResolvedValue(recipes);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [plan] });
    vi.mocked(listPendingForWeek).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("persists and resolves the current plan as confirmed", async () => {
    const result = await confirmCurrentPlan();

    expect(upsertWeekPlan).toHaveBeenCalledWith({
      ...plan,
      confirmed: true,
      confirmedAt: "2026-07-19T18:00:00.000Z",
    });
    expect(result).toMatchObject({
      weekOf: plan.weekOf,
      confirmed: true,
      confirmedAt: "2026-07-19T18:00:00.000Z",
    });
  });

  it("resets confirmation when the plan is regenerated", async () => {
    const confirmedPlan = {
      ...plan,
      confirmed: true,
      confirmedAt: "2026-07-12T18:00:00.000Z",
    };
    vi.mocked(getHistory).mockResolvedValue({ weeks: [confirmedPlan] });

    const result = await regenerateCurrentPlan(plan.locks);

    expect(upsertWeekPlan).toHaveBeenLastCalledWith(
      expect.objectContaining({
        confirmed: false,
      })
    );
    expect(result).toMatchObject({ confirmed: false });
    expect(result.confirmedAt).toBeUndefined();
  });
});
