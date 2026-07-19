import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResolvedWeekPlan } from "./types";

vi.mock("./dataStore", () => ({
  getSettings: vi.fn(),
  getStaples: vi.fn(),
}));

import { getSettings, getStaples } from "./dataStore";
import { groceryListFor } from "./groceryListFor.server";

const planFixture = (): ResolvedWeekPlan => ({
  weekOf: "2026-07-13",
  dinners: [
    {
      id: "tacos",
      name: "Tacos",
      protein: "beef",
      cookMinutes: 25,
      tags: [],
      ingredients: ["1 lb ground beef"],
    },
  ],
  girlLunch: { id: "g", name: "Girl lunch", ingredients: [] },
  boyLunch: { id: "b", name: "Boy lunch", ingredients: [] },
  locks: { dinners: [null], girlLunch: null, boyLunch: null },
  preferences: { cookEffortTarget: 3, noveltyTarget: 3 },
  miscGrocery: [],
  confirmed: false,
});

describe("groceryListFor", () => {
  beforeEach(() => {
    vi.mocked(getSettings).mockResolvedValue({
      dinnersPerWeek: 5,
      maxCookMinutes: 45,
      noRepeatWeeks: 3,
      servings: 4,
      cookEffortTarget: 3,
      noveltyTarget: 3,
      includeStaplesInGroceryList: true,
    });
    vi.mocked(getStaples).mockResolvedValue({
      items: [{ id: "s1", name: "Milk", section: "Dairy & Eggs" }],
    });
  });

  it("includes staples when settings enable them", async () => {
    const sections = await groceryListFor(planFixture());
    const dairy = sections.find((s) => s.section === "Dairy & Eggs");
    expect(dairy?.items.some((i) => i.name === "Milk")).toBe(true);
  });

  it("omits staples when settings disable them", async () => {
    vi.mocked(getSettings).mockResolvedValue({
      dinnersPerWeek: 5,
      maxCookMinutes: 45,
      noRepeatWeeks: 3,
      servings: 4,
      cookEffortTarget: 3,
      noveltyTarget: 3,
      includeStaplesInGroceryList: false,
    });

    const sections = await groceryListFor(planFixture());
    expect(sections.flatMap((s) => s.items).some((i) => i.name === "Milk")).toBe(false);
  });
});
