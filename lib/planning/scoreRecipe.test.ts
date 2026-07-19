import { describe, expect, it } from "vitest";
import { scoreDinnerCandidate } from "./scoreRecipe";
import type { Dinner } from "@/lib/types";

const dinner = (overrides: Partial<Dinner> & Pick<Dinner, "id">): Dinner => ({
  id: overrides.id,
  name: overrides.name ?? overrides.id,
  protein: overrides.protein ?? "chicken",
  cookMinutes: overrides.cookMinutes ?? 25,
  tags: [],
  ingredients: [],
  effortScore: overrides.effortScore ?? 3,
  noveltyScore: overrides.noveltyScore ?? 3,
});

describe("scoreDinnerCandidate", () => {
  it("prefers dinners closer to the effort and novelty targets", () => {
    const easyFamiliar = dinner({ id: "a", effortScore: 2, noveltyScore: 2 });
    const hardNew = dinner({ id: "b", effortScore: 5, noveltyScore: 5 });
    const prefs = { cookEffortTarget: 2, noveltyTarget: 2 };
    expect(scoreDinnerCandidate(easyFamiliar, prefs, new Set())).toBeLessThan(
      scoreDinnerCandidate(hardNew, prefs, new Set())
    );
  });

  it("penalizes recently used dinners", () => {
    const candidate = dinner({ id: "a", effortScore: 3, noveltyScore: 3 });
    const prefs = { cookEffortTarget: 3, noveltyTarget: 3 };
    expect(scoreDinnerCandidate(candidate, prefs, new Set(["a"]))).toBeGreaterThan(
      scoreDinnerCandidate(candidate, prefs, new Set())
    );
  });
});
