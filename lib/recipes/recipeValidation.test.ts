import { describe, expect, it } from "vitest";
import { parseCatalogRecipeInput, recipeToPlannerViews } from "./recipeValidation";
import type { CatalogRecipe } from "@/lib/types";

describe("parseCatalogRecipeInput", () => {
  it("accepts a dinner with required fields", () => {
    const recipe = parseCatalogRecipeInput({
      id: "tacos",
      kind: "dinner",
      name: "Tacos",
      protein: "beef",
      cookMinutes: 25,
      ingredients: ["1 lb ground beef"],
    });
    expect(recipe.status).toBe("active");
    expect(recipe.favorite).toBe(false);
    expect(recipe.effortScore).toBe(3);
    expect(recipe.noveltyScore).toBe(3);
  });

  it("preserves the optional wildcard flag for an untried dinner", () => {
    const recipe = parseCatalogRecipeInput({
      id: "new-dinner",
      kind: "dinner",
      name: "New dinner",
      protein: "chicken",
      cookMinutes: 25,
      wildcard: true,
    });

    expect(recipe.wildcard).toBe(true);
  });

  it("rejects archived hard-delete attempts by requiring status archive instead", () => {
    expect(() =>
      parseCatalogRecipeInput({
        id: "tacos",
        kind: "dinner",
        name: "Tacos",
        protein: "beef",
        cookMinutes: 25,
        ingredients: [],
        status: "deleted",
      })
    ).toThrow(/status/i);
  });
});

describe("recipeToPlannerViews", () => {
  it("excludes archived recipes from planner pools", () => {
    const recipes: CatalogRecipe[] = [
      {
        id: "tacos",
        kind: "dinner",
        name: "Tacos",
        protein: "beef",
        cookMinutes: 25,
        tags: [],
        ingredients: ["beef"],
        instructions: [],
        status: "active",
        favorite: false,
        effortScore: 3,
        noveltyScore: 3,
      },
      {
        id: "old",
        kind: "dinner",
        name: "Old",
        protein: "chicken",
        cookMinutes: 20,
        tags: [],
        ingredients: [],
        instructions: [],
        status: "archived",
        favorite: false,
        effortScore: 2,
        noveltyScore: 2,
      },
    ];
    const views = recipeToPlannerViews(recipes, 4);
    expect(views.dinners.map((d) => d.id)).toEqual(["tacos"]);
  });

  it("keeps the wildcard flag in the dinner planner view", () => {
    const views = recipeToPlannerViews(
      [
        {
          id: "new-dinner",
          kind: "dinner",
          name: "New dinner",
          protein: "chicken",
          cookMinutes: 25,
          tags: [],
          ingredients: [],
          instructions: [],
          status: "active",
          favorite: false,
          wildcard: true,
          effortScore: 3,
          noveltyScore: 3,
        },
      ],
      4
    );

    expect(views.dinners[0].wildcard).toBe(true);
  });
});
