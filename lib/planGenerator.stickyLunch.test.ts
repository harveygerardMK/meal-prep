import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogRecipe, RecipeData, Settings, WeekPlan } from "./types";

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
import { ensureCurrentPlan, regenerateCurrentPlan } from "./planGenerator";
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
    {
      id: "chicken-a",
      name: "Chicken A",
      protein: "chicken",
      cookMinutes: 20,
      tags: [],
      ingredients: [],
    },
    {
      id: "beef-a",
      name: "Beef A",
      protein: "beef",
      cookMinutes: 25,
      tags: [],
      ingredients: [],
    },
    {
      id: "pork-a",
      name: "Pork A",
      protein: "pork",
      cookMinutes: 30,
      tags: [],
      ingredients: [],
    },
  ],
  girlLunches: [
    { id: "girl-lunch-1", name: "Girl lunch 1", ingredients: [] },
    { id: "girl-lunch-2", name: "Girl lunch 2", ingredients: [] },
  ],
  boyLunches: [
    { id: "boy-lunch-1", name: "Boy lunch 1", ingredients: [] },
    { id: "boy-lunch-2", name: "Boy lunch 2", ingredients: [] },
  ],
};

function dinnerRecipe(
  id: string,
  name: string,
  protein: string,
  cookMinutes: number
): CatalogRecipe {
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

function lunchRecipe(
  id: string,
  kind: "girl_lunch" | "boy_lunch",
  name: string
): CatalogRecipe {
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
  lunchRecipe("girl-lunch-1", "girl_lunch", "Girl lunch 1"),
  lunchRecipe("girl-lunch-2", "girl_lunch", "Girl lunch 2"),
  lunchRecipe("boy-lunch-1", "boy_lunch", "Boy lunch 1"),
  lunchRecipe("boy-lunch-2", "boy_lunch", "Boy lunch 2"),
];

describe("sticky lunch locks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-19T18:00:00.000Z"));
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(getRecipes).mockResolvedValue(recipes);
    vi.mocked(listCatalogRecipes).mockResolvedValue(catalog);
    vi.mocked(listPendingForWeek).mockResolvedValue([]);
    vi.mocked(getWildcardState).mockResolvedValue({ lastWildcardMonth: null });
    vi.mocked(upsertWeekPlan).mockImplementation(async (plan) => ({ weeks: [plan] }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("carries prior week lunches into a new week and locks them", async () => {
    const prior: WeekPlan = {
      weekOf: "2026-07-06",
      dinners: [
        { type: "recipe", recipeId: "chicken-a" },
        { type: "recipe", recipeId: "beef-a" },
      ],
      girlLunch: "girl-lunch-1",
      boyLunch: "boy-lunch-1",
      locks: { dinners: [null, null], girlLunch: null, boyLunch: null },
    };
    vi.mocked(getWeekPlan).mockResolvedValue(null);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [prior] });

    const result = await ensureCurrentPlan();

    expect(result.girlLunch.id).toBe("girl-lunch-1");
    expect(result.boyLunch.id).toBe("boy-lunch-1");
    expect(result.locks.girlLunch).toBe("girl-lunch-1");
    expect(result.locks.boyLunch).toBe("boy-lunch-1");

    const saved = vi.mocked(upsertWeekPlan).mock.calls.at(-1)![0];
    expect(saved.girlLunch).toBe("girl-lunch-1");
    expect(saved.boyLunch).toBe("boy-lunch-1");
    expect(saved.locks.girlLunch).toBe("girl-lunch-1");
    expect(saved.locks.boyLunch).toBe("boy-lunch-1");
  });

  it("locks freshly picked lunches on the first week", async () => {
    vi.mocked(getWeekPlan).mockResolvedValue(null);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [] });

    const result = await ensureCurrentPlan();

    expect(result.locks.girlLunch).toBe(result.girlLunch.id);
    expect(result.locks.boyLunch).toBe(result.boyLunch.id);
    expect(result.locks.girlLunch).not.toBeNull();
    expect(result.locks.boyLunch).not.toBeNull();
  });

  it("keeps locked lunches when regenerating unlocked dinners", async () => {
    const current: WeekPlan = {
      weekOf: "2026-07-13",
      dinners: [
        { type: "recipe", recipeId: "chicken-a" },
        { type: "recipe", recipeId: "beef-a" },
      ],
      girlLunch: "girl-lunch-1",
      boyLunch: "boy-lunch-1",
      locks: {
        dinners: [null, null],
        girlLunch: "girl-lunch-1",
        boyLunch: "boy-lunch-1",
      },
    };
    vi.mocked(getWeekPlan).mockResolvedValue(current);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [current] });

    const result = await regenerateCurrentPlan({
      dinners: [null, null],
      girlLunch: "girl-lunch-1",
      boyLunch: "boy-lunch-1",
    });

    expect(result.girlLunch.id).toBe("girl-lunch-1");
    expect(result.boyLunch.id).toBe("boy-lunch-1");
    expect(result.locks.girlLunch).toBe("girl-lunch-1");
    expect(result.locks.boyLunch).toBe("boy-lunch-1");
  });

  it("allows unlocked lunch regenerate then auto-locks the new pick", async () => {
    const current: WeekPlan = {
      weekOf: "2026-07-13",
      dinners: [
        { type: "recipe", recipeId: "chicken-a" },
        { type: "recipe", recipeId: "beef-a" },
      ],
      girlLunch: "girl-lunch-1",
      boyLunch: "boy-lunch-1",
      locks: {
        dinners: ["chicken-a", "beef-a"],
        girlLunch: "girl-lunch-1",
        boyLunch: "boy-lunch-1",
      },
    };
    vi.mocked(getWeekPlan).mockResolvedValue(current);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [current] });

    const result = await regenerateCurrentPlan({
      dinners: ["chicken-a", "beef-a"],
      girlLunch: null,
      boyLunch: "boy-lunch-1",
    });

    expect(result.girlLunch.id).toBe("girl-lunch-2");
    expect(result.boyLunch.id).toBe("boy-lunch-1");
    expect(result.locks.girlLunch).toBe("girl-lunch-2");
    expect(result.locks.boyLunch).toBe("boy-lunch-1");
  });
});
