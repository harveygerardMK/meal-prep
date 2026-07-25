import { describe, expect, it } from "vitest";
import { draftFromAiStructure } from "./structureImport";

describe("draftFromAiStructure", () => {
  it("maps AI JSON into an import draft with high confidence", () => {
    const draft = draftFromAiStructure({
      name: "Honey Garlic Chicken",
      ingredients: ["1 lb chicken", "3 tbsp honey", "4 cloves garlic"],
      instructions: ["Mix", "Bake"],
      protein: "chicken",
      cookMinutes: 35,
    });
    expect(draft.name).toBe("Honey Garlic Chicken");
    expect(draft.ingredients).toHaveLength(3);
    expect(draft.protein).toBe("chicken");
    expect(draft.confidence).toBeGreaterThan(0.8);
    expect(draft.missingFields).toEqual([]);
  });

  it("marks missing ingredients when the model returns none", () => {
    const draft = draftFromAiStructure({
      name: "Mystery",
      ingredients: [],
      instructions: [],
    });
    expect(draft.missingFields).toContain("ingredients");
  });
});
