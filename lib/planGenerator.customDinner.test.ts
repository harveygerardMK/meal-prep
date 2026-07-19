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

import {
  getHistory,
  getRecipes,
  getSettings,
  getWeekPlan,
  listCatalogRecipes,
  upsertWeekPlan,
} from "./dataStore";
import {
  recentDinnerIds,
  regenerateCurrentPlan,
  setCustomDinnerForCurrentWeek,
} from "./planGenerator";
import { listPendingForWeek } from "./repositories/queueRepository";

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
  ],
  girlLunches: [{ id: "girl-lunch-1", name: "Girl lunch", ingredients: [] }],
  boyLunches: [{ id: "boy-lunch-1", name: "Boy lunch", ingredients: [] }],
};

const catalog: CatalogRecipe[] = [
  {
    id: "chicken-a",
    kind: "dinner",
    name: "Chicken A",
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
    id: "beef-a",
    kind: "dinner",
    name: "Beef A",
    protein: "beef",
    cookMinutes: 25,
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

describe("recentDinnerIds", () => {
  it("collects only recipe slot ids and ignores customs", () => {
    const history: History = {
      weeks: [
        {
          weekOf: "2026-07-06",
          dinners: [
            { type: "recipe", recipeId: "chicken-a" },
            {
              type: "custom",
              custom: { id: "custom:abc", name: "Leftovers", ingredients: [] },
            },
          ],
          girlLunch: "girl-lunch-1",
          boyLunch: "boy-lunch-1",
          locks: { dinners: [null, null], girlLunch: null, boyLunch: null },
        },
      ],
    };

    const ids = recentDinnerIds(history, "2026-07-13", 2);
    expect(ids.has("chicken-a")).toBe(true);
    expect(ids.has("custom:abc")).toBe(false);
    expect(ids.size).toBe(1);
  });
});

describe("setCustomDinnerForCurrentWeek", () => {
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

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-19T18:00:00.000Z"));
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(getWeekPlan).mockResolvedValue(currentPlan);
    vi.mocked(listCatalogRecipes).mockResolvedValue(catalog);
    vi.mocked(upsertWeekPlan).mockResolvedValue({ weeks: [currentPlan] });
    vi.mocked(getRecipes).mockResolvedValue(recipes);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [currentPlan] });
    vi.mocked(listPendingForWeek).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("locks the slot and stores a custom dinner with an opaque id, never a catalog id", async () => {
    const result = await setCustomDinnerForCurrentWeek({
      index: 1,
      name: "Grandma's stew",
      ingredients: ["beef", "carrots"],
      cookMinutes: 45,
      protein: "beef",
    });

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.dinners[0]).toEqual({ type: "recipe", recipeId: "chicken-a" });
    expect(saved.dinners[1].type).toBe("custom");
    const customId =
      saved.dinners[1].type === "custom" ? saved.dinners[1].custom.id : "";
    expect(customId).toMatch(/^custom:/);
    expect(customId).not.toBe("beef-a");
    expect(saved.locks.dinners).toEqual([null, customId]);

    expect(result.dinners[1]).toMatchObject({
      name: "Grandma's stew",
      protein: "beef",
      cookMinutes: 45,
      tags: ["custom"],
      ingredients: ["beef", "carrots"],
    });
  });

  it("resets confirmation when a custom dinner is set", async () => {
    vi.mocked(getWeekPlan).mockResolvedValue({
      ...currentPlan,
      confirmed: true,
      confirmedAt: "2026-07-18T00:00:00.000Z",
    });

    const result = await setCustomDinnerForCurrentWeek({
      index: 0,
      name: "Leftovers",
      ingredients: [],
    });

    expect(result.confirmed).toBe(false);
    expect(result.confirmedAt).toBeUndefined();
  });

  it("rejects an out-of-range index", async () => {
    await expect(
      setCustomDinnerForCurrentWeek({ index: 5, name: "X", ingredients: [] })
    ).rejects.toThrow(/invalid index/i);
  });

  it("throws PlanNotFoundError when there is no plan for the week", async () => {
    vi.mocked(getWeekPlan).mockResolvedValue(null);
    await expect(
      setCustomDinnerForCurrentWeek({ index: 0, name: "X", ingredients: [] })
    ).rejects.toThrow(/no plan/i);
  });
});

describe("custom dinner locks survive regenerate", () => {
  const weekOf = "2026-07-13";
  let planWithCustom: WeekPlan;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-19T18:00:00.000Z"));
    planWithCustom = {
      weekOf,
      dinners: [
        { type: "recipe", recipeId: "chicken-a" },
        {
          type: "custom",
          custom: { id: "custom:keep-me", name: "Leftovers", ingredients: ["rice"] },
        },
      ],
      girlLunch: "girl-lunch-1",
      boyLunch: "boy-lunch-1",
      locks: { dinners: [null, "custom:keep-me"], girlLunch: null, boyLunch: null },
    };
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(listCatalogRecipes).mockResolvedValue(catalog);
    vi.mocked(getRecipes).mockResolvedValue(recipes);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [planWithCustom] });
    vi.mocked(listPendingForWeek).mockResolvedValue([]);
    vi.mocked(upsertWeekPlan).mockImplementation(async (plan) => ({ weeks: [plan] }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps the locked custom slot untouched while the other slot reshuffles", async () => {
    const result = await regenerateCurrentPlan({
      dinners: [null, "custom:keep-me"],
      girlLunch: null,
      boyLunch: null,
    });

    expect(result.dinners[1]).toMatchObject({
      id: "custom:keep-me",
      name: "Leftovers",
      ingredients: ["rice"],
      tags: ["custom"],
    });
    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.dinners[1]).toEqual(planWithCustom.dinners[1]);
  });
});
