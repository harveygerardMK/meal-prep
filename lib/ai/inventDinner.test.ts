import { describe, expect, it } from "vitest";
import { validateInventedDinner } from "./inventDinner";

describe("validateInventedDinner", () => {
  it("accepts a practical dinner draft under the cook-time cap", () => {
    const draft = validateInventedDinner(
      {
        name: "Turkey Taco Skillet",
        protein: "turkey",
        cookMinutes: 25,
        ingredients: ["1 lb ground turkey", "1 packet taco seasoning", "8 tortillas"],
        instructions: ["Brown turkey", "Season and serve"],
        tags: ["weeknight", "tacos"],
      },
      40
    );
    expect(draft.name).toBe("Turkey Taco Skillet");
    expect(draft.cookMinutes).toBe(25);
    expect(draft.ingredients).toHaveLength(3);
  });

  it("rejects drafts over max cook minutes", () => {
    expect(() =>
      validateInventedDinner(
        {
          name: "Roast",
          protein: "beef",
          cookMinutes: 90,
          ingredients: ["3 lb roast", "salt"],
          instructions: ["Roast"],
          tags: [],
        },
        40
      )
    ).toThrow(/exceeds max/i);
  });

  it("rejects drafts with too few ingredients", () => {
    expect(() =>
      validateInventedDinner(
        {
          name: "Toast",
          protein: "varies",
          cookMinutes: 5,
          ingredients: ["bread"],
          instructions: [],
          tags: [],
        },
        40
      )
    ).toThrow(/two ingredients/i);
  });
});
