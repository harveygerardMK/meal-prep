import { describe, expect, it } from "vitest";
import { extractRecipeFromText } from "./extractRecipeFromText";

describe("extractRecipeFromText", () => {
  it("pulls a title and ingredient-looking lines from a caption", () => {
    const draft = extractRecipeFromText({
      titleHint: "Garlic Butter Pasta",
      text: `Garlic Butter Pasta
Ingredients:
- 1 lb spaghetti
- 4 tbsp butter
- 4 cloves garlic
Steps:
1. Boil pasta
2. Melt butter and garlic
3. Toss together`,
    });
    expect(draft.name.toLowerCase()).toContain("garlic");
    expect(draft.ingredients.length).toBeGreaterThanOrEqual(2);
    expect(draft.instructions.length).toBeGreaterThanOrEqual(2);
    expect(draft.confidence).toBeGreaterThan(0.4);
  });

  it("marks low confidence when almost no structure is present", () => {
    const draft = extractRecipeFromText({
      titleHint: "Dinner idea",
      text: "so good you guys",
    });
    expect(draft.confidence).toBeLessThan(0.5);
    expect(draft.missingFields).toContain("ingredients");
  });
});
