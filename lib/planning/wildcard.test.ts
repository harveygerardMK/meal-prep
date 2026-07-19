import { describe, expect, it } from "vitest";
import type { CatalogRecipe } from "../types";
import { planMonthlyWildcard } from "./wildcard";

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

describe("planMonthlyWildcard", () => {
  it("draws an active wildcard dinner for an eligible month", () => {
    const result = planMonthlyWildcard({
      month: "2026-07",
      state: { lastWildcardMonth: null },
      candidates: [wildcardDinner],
      slotIndex: 2,
      random: () => 0,
    });

    expect(result).toEqual({
      recipeId: "wildcard-dinner",
      slotIndex: 2,
      nextState: { lastWildcardMonth: "2026-07" },
    });
  });

  it("does not draw when the wildcard pool is empty", () => {
    const result = planMonthlyWildcard({
      month: "2026-07",
      state: { lastWildcardMonth: null },
      candidates: [],
      slotIndex: 0,
    });

    expect(result).toEqual({
      nextState: { lastWildcardMonth: null },
    });
  });

  it("does not draw again in an ineligible month", () => {
    const result = planMonthlyWildcard({
      month: "2026-07",
      state: { lastWildcardMonth: "2026-07" },
      candidates: [wildcardDinner],
      slotIndex: 0,
    });

    expect(result).toEqual({ nextState: { lastWildcardMonth: "2026-07" } });
  });

  it("does not draw when queue priority filled every dinner slot", () => {
    const result = planMonthlyWildcard({
      month: "2026-07",
      state: { lastWildcardMonth: null },
      candidates: [wildcardDinner],
      slotIndex: null,
    });

    expect(result).toEqual({
      nextState: { lastWildcardMonth: null },
    });
  });
});
