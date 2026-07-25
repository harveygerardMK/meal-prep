import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogRecipe, Settings, WeekPlan } from "./types";

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
  saveCatalogRecipe: vi.fn(async (recipe: CatalogRecipe) => recipe),
}));

vi.mock("./ai/inventDinner", () => ({
  inventDinnerForWeek: vi.fn(),
}));

import { getHistory, getSettings, listCatalogRecipes, upsertWeekPlan } from "./dataStore";
import { inventDinnerForWeek } from "./ai/inventDinner";
import { injectAiDinnerIntoPlan } from "./planGenerator";
import { saveCatalogRecipe } from "./repositories/recipeRepository";

const settings: Settings = {
  dinnersPerWeek: 2,
  maxCookMinutes: 40,
  noRepeatWeeks: 2,
  servings: 2,
  cookEffortTarget: 3,
  noveltyTarget: 3,
  includeStaplesInGroceryList: true,
};

const catalog: CatalogRecipe[] = [
  {
    id: "chicken-a",
    kind: "dinner",
    name: "Chicken A",
    protein: "chicken",
    cookMinutes: 20,
    tags: [],
    ingredients: ["1 lb chicken"],
    instructions: ["Cook"],
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
    ingredients: ["1 lb beef"],
    instructions: ["Cook"],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  },
];

const plan: WeekPlan = {
  weekOf: "2026-07-20",
  dinners: [
    { type: "recipe", recipeId: "chicken-a" },
    { type: "recipe", recipeId: "beef-a" },
  ],
  girlLunch: "girl-lunch-1",
  boyLunch: "boy-lunch-1",
  locks: {
    dinners: ["chicken-a", null],
    girlLunch: null,
    boyLunch: null,
  },
  preferences: { cookEffortTarget: 3, noveltyTarget: 3 },
  confirmed: false,
};

describe("injectAiDinnerIntoPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(listCatalogRecipes).mockResolvedValue(catalog);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [plan] });
    vi.mocked(upsertWeekPlan).mockResolvedValue(undefined as never);
    vi.mocked(saveCatalogRecipe).mockImplementation(async (recipe) => recipe);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("saves an invented dinner into the first unlocked slot", async () => {
    vi.mocked(inventDinnerForWeek).mockResolvedValue({
      name: "Turkey Taco Skillet",
      protein: "turkey",
      cookMinutes: 25,
      ingredients: ["1 lb ground turkey", "8 tortillas", "1 cup salsa"],
      instructions: ["Brown turkey", "Serve in tortillas"],
      tags: ["weeknight", "tacos"],
    });

    const result = await injectAiDinnerIntoPlan(plan, plan.locks, plan.preferences!);

    expect(result.aiDinnerName).toBe("Turkey Taco Skillet");
    expect(result.aiDinnerFailed).toBeUndefined();
    expect(result.plan.dinners[0]).toEqual({ type: "recipe", recipeId: "chicken-a" });
    expect(result.plan.dinners[1]).toEqual({
      type: "recipe",
      recipeId: "turkey-taco-skillet",
    });
    expect(saveCatalogRecipe).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "turkey-taco-skillet",
        tags: expect.arrayContaining(["ai", "generated"]),
        noveltyScore: 5,
      })
    );
  });

  it("leaves the catalog pick when invent fails", async () => {
    vi.mocked(inventDinnerForWeek).mockRejectedValue(new Error("AI down"));

    const result = await injectAiDinnerIntoPlan(plan, plan.locks, plan.preferences!);

    expect(result.aiDinnerFailed).toBe(true);
    expect(result.plan.dinners[1]).toEqual({ type: "recipe", recipeId: "beef-a" });
    expect(saveCatalogRecipe).not.toHaveBeenCalled();
  });

  it("skips invent when every dinner slot is locked", async () => {
    const locked = {
      ...plan,
      locks: { ...plan.locks, dinners: ["chicken-a", "beef-a"] },
    };
    const result = await injectAiDinnerIntoPlan(
      locked,
      locked.locks,
      plan.preferences!
    );
    expect(inventDinnerForWeek).not.toHaveBeenCalled();
    expect(result.plan).toEqual(locked);
  });
});
