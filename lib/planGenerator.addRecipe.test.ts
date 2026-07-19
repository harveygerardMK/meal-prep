import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogRecipe, History, RecipeData, Settings, WeekPlan } from "./types";

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

vi.mock("./repositories/wildcardStateRepository", () => ({
  getWildcardState: vi.fn(),
  saveWildcardState: vi.fn(),
}));

vi.mock("./repositories/recipeRepository", () => ({
  saveCatalogRecipe: vi.fn(),
}));

import {
  getHistory,
  getRecipes,
  getSettings,
  getWeekPlan,
  listCatalogRecipes,
  upsertWeekPlan,
} from "./dataStore";
import { addRecipeToCurrentWeek } from "./planGenerator";
import { listPendingForWeek } from "./repositories/queueRepository";
import { getWildcardState } from "./repositories/wildcardStateRepository";

const settings: Settings = {
  dinnersPerWeek: 2,
  maxCookMinutes: 40,
  noRepeatWeeks: 2,
  servings: 2,
  cookEffortTarget: 3,
  noveltyTarget: 3,
  includeStaplesInGroceryList: true,
};

const recipes: RecipeData = {
  servings: 2,
  dinners: [
    { id: "chicken-a", name: "Chicken A", protein: "chicken", cookMinutes: 20, tags: [], ingredients: [] },
    { id: "beef-a", name: "Beef A", protein: "beef", cookMinutes: 25, tags: [], ingredients: [] },
    { id: "pork-a", name: "Pork A", protein: "pork", cookMinutes: 30, tags: [], ingredients: [] },
  ],
  girlLunches: [
    { id: "girl-lunch-1", name: "Girl lunch", ingredients: [] },
    { id: "girl-lunch-2", name: "Girl lunch 2", ingredients: [] },
  ],
  boyLunches: [{ id: "boy-lunch-1", name: "Boy lunch", ingredients: [] }],
};

function dinnerRecipe(id: string, name: string, protein: string, cookMinutes: number): CatalogRecipe {
  return {
    id,
    kind: "dinner",
    name,
    protein,
    cookMinutes,
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  };
}

function lunchRecipe(id: string, kind: "girl_lunch" | "boy_lunch", name: string): CatalogRecipe {
  return {
    id,
    kind,
    name,
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  };
}

const catalog: CatalogRecipe[] = [
  dinnerRecipe("chicken-a", "Chicken A", "chicken", 20),
  dinnerRecipe("beef-a", "Beef A", "beef", 25),
  dinnerRecipe("pork-a", "Pork A", "pork", 30),
  { ...dinnerRecipe("old-dish", "Old Dish", "beef", 25), status: "archived" },
  lunchRecipe("girl-lunch-1", "girl_lunch", "Girl lunch"),
  lunchRecipe("girl-lunch-2", "girl_lunch", "Girl lunch 2"),
  lunchRecipe("boy-lunch-1", "boy_lunch", "Boy lunch"),
];

describe("addRecipeToCurrentWeek", () => {
  const currentPlan: WeekPlan = {
    weekOf: "2026-07-13",
    dinners: [
      { type: "recipe", recipeId: "chicken-a" },
      { type: "recipe", recipeId: "beef-a" },
    ],
    girlLunch: "girl-lunch-1",
    boyLunch: "boy-lunch-1",
    locks: { dinners: [null, null], girlLunch: null, boyLunch: null },
  };
  const history: History = { weeks: [currentPlan] };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-14T18:00:00.000Z"));
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(getWeekPlan).mockResolvedValue(currentPlan);
    vi.mocked(listCatalogRecipes).mockResolvedValue(catalog);
    vi.mocked(getRecipes).mockResolvedValue(recipes);
    vi.mocked(getHistory).mockResolvedValue(history);
    vi.mocked(listPendingForWeek).mockResolvedValue([]);
    vi.mocked(getWildcardState).mockResolvedValue({ lastWildcardMonth: null });
    vi.mocked(upsertWeekPlan).mockImplementation(async (plan) => ({ weeks: [plan] }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("puts a dinner into the first unlocked slot and locks it", async () => {
    const result = await addRecipeToCurrentWeek("pork-a");

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.dinners[0]).toEqual({ type: "recipe", recipeId: "pork-a" });
    expect(saved.dinners[1]).toEqual({ type: "recipe", recipeId: "beef-a" });
    expect(saved.locks.dinners).toEqual(["pork-a", null]);
    expect(result.dinners[0]).toMatchObject({ id: "pork-a", name: "Pork A" });
  });

  it("skips locked slots when placing a dinner", async () => {
    vi.mocked(getWeekPlan).mockResolvedValue({
      ...currentPlan,
      locks: { dinners: ["chicken-a", null], girlLunch: null, boyLunch: null },
    });

    await addRecipeToCurrentWeek("pork-a");

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.dinners[0]).toEqual({ type: "recipe", recipeId: "chicken-a" });
    expect(saved.dinners[1]).toEqual({ type: "recipe", recipeId: "pork-a" });
    expect(saved.locks.dinners).toEqual(["chicken-a", "pork-a"]);
  });

  it("resets confirmation when a dinner is added", async () => {
    vi.mocked(getWeekPlan).mockResolvedValue({
      ...currentPlan,
      confirmed: true,
      confirmedAt: "2026-07-13T00:00:00.000Z",
    });

    const result = await addRecipeToCurrentWeek("pork-a");

    expect(result.confirmed).toBe(false);
    expect(result.confirmedAt).toBeUndefined();
  });

  it("is idempotent: locks the slot when the dinner is already on the menu", async () => {
    const result = await addRecipeToCurrentWeek("beef-a");

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.dinners).toEqual(currentPlan.dinners);
    expect(saved.locks.dinners).toEqual([null, "beef-a"]);
    expect(result.dinners[1]).toMatchObject({ id: "beef-a" });
  });

  it("throws when every dinner slot is locked", async () => {
    vi.mocked(getWeekPlan).mockResolvedValue({
      ...currentPlan,
      locks: { dinners: ["chicken-a", "beef-a"], girlLunch: null, boyLunch: null },
    });

    await expect(addRecipeToCurrentWeek("pork-a")).rejects.toThrow(/locked/i);
  });

  it("sets and locks the girl lunch for a girl_lunch recipe", async () => {
    const result = await addRecipeToCurrentWeek("girl-lunch-2");

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.girlLunch).toBe("girl-lunch-2");
    expect(saved.locks.girlLunch).toBe("girl-lunch-2");
    expect(saved.dinners).toEqual(currentPlan.dinners);
    expect(result.girlLunch).toMatchObject({ id: "girl-lunch-2" });
  });

  it("rejects an unknown recipe id", async () => {
    await expect(addRecipeToCurrentWeek("nope")).rejects.toThrow(/invalid/i);
  });

  it("rejects an archived recipe", async () => {
    await expect(addRecipeToCurrentWeek("old-dish")).rejects.toThrow(/invalid/i);
  });

  it("creates this week's plan first when none exists", async () => {
    vi.mocked(getWeekPlan)
      .mockResolvedValueOnce(null)
      .mockResolvedValue(currentPlan);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [] });

    const result = await addRecipeToCurrentWeek("pork-a");

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.locks.dinners).toContain("pork-a");
    expect(result.dinners.some((d) => d.id === "pork-a")).toBe(true);
  });
});
