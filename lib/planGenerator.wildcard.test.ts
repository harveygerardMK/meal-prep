import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CatalogRecipe, RecipeData, Settings } from "./types";

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
import { ensureCurrentPlan } from "./planGenerator";
import { listPendingForWeek } from "./repositories/queueRepository";
import { saveCatalogRecipe } from "./repositories/recipeRepository";
import {
  getWildcardState,
  saveWildcardState,
} from "./repositories/wildcardStateRepository";

const settings: Settings = {
  dinnersPerWeek: 2,
  maxCookMinutes: 30,
  noRepeatWeeks: 3,
  servings: 4,
  cookEffortTarget: 3,
  noveltyTarget: 3,
  includeStaplesInGroceryList: true,
};

const recipes: RecipeData = {
  servings: 4,
  dinners: [
    {
      id: "normal-dinner",
      name: "Normal dinner",
      protein: "beef",
      cookMinutes: 30,
      tags: [],
      ingredients: [],
    },
    {
      id: "normal-dinner-2",
      name: "Second normal dinner",
      protein: "pork",
      cookMinutes: 30,
      tags: [],
      ingredients: [],
    },
  ],
  girlLunches: [{ id: "girl-lunch", name: "Girl lunch", ingredients: [] }],
  boyLunches: [{ id: "boy-lunch", name: "Boy lunch", ingredients: [] }],
};

const wildcardDinner: CatalogRecipe = {
  id: "wildcard-dinner",
  kind: "dinner",
  name: "Wildcard dinner",
  protein: "chicken",
  cookMinutes: 30,
  tags: [],
  ingredients: [],
  instructions: [],
  status: "active",
  favorite: false,
  wildcard: true,
  effortScore: 3,
  noveltyScore: 3,
};

const catalog: CatalogRecipe[] = [
  {
    id: "normal-dinner",
    kind: "dinner",
    name: "Normal dinner",
    protein: "beef",
    cookMinutes: 30,
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  },
  {
    id: "normal-dinner-2",
    kind: "dinner",
    name: "Second normal dinner",
    protein: "pork",
    cookMinutes: 30,
    tags: [],
    ingredients: [],
    instructions: [],
    status: "active",
    favorite: false,
    effortScore: 3,
    noveltyScore: 3,
  },
  wildcardDinner,
  {
    id: "girl-lunch",
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
    id: "boy-lunch",
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

describe("ensureCurrentPlan monthly wildcard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T18:00:00.000Z"));
    vi.mocked(getSettings).mockResolvedValue(settings);
    vi.mocked(getWeekPlan).mockResolvedValue(null);
    vi.mocked(getHistory).mockResolvedValue({ weeks: [] });
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

  it("uses a wildcard recipe despite recent avoidance, then graduates it", async () => {
    vi.mocked(getHistory).mockResolvedValue({
      weeks: [
        {
          weekOf: "2026-06-29",
          dinners: [{ type: "recipe", recipeId: "wildcard-dinner" }],
          girlLunch: "girl-lunch",
          boyLunch: "boy-lunch",
          locks: { dinners: [null], girlLunch: null, boyLunch: null },
        },
      ],
    });

    const result = await ensureCurrentPlan();

    expect(result.dinners.map((dinner) => dinner.id)).toContain("wildcard-dinner");
    expect(saveCatalogRecipe).toHaveBeenCalledWith({
      ...wildcardDinner,
      wildcard: false,
    });
    expect(saveWildcardState).toHaveBeenCalledWith({ lastWildcardMonth: "2026-07" });
  });
});
