import { describe, expect, it } from "vitest";
import {
  coerceDinnerSlot,
  coerceDinnerSlots,
  customDinnerToDinner,
  dinnerSlotId,
} from "./dinnerSlot";
import type { CustomDinner, DinnerSlot } from "./types";

describe("coerceDinnerSlot", () => {
  it("coerces a legacy string id into a recipe slot", () => {
    expect(coerceDinnerSlot("tacos")).toEqual({ type: "recipe", recipeId: "tacos" });
  });

  it("passes an existing recipe slot through unchanged", () => {
    const slot: DinnerSlot = { type: "recipe", recipeId: "tacos" };
    expect(coerceDinnerSlot(slot)).toBe(slot);
  });

  it("passes an existing custom slot through unchanged", () => {
    const slot: DinnerSlot = {
      type: "custom",
      custom: { id: "custom:abc", name: "Leftovers", ingredients: [] },
    };
    expect(coerceDinnerSlot(slot)).toBe(slot);
  });
});

describe("coerceDinnerSlots", () => {
  it("coerces a mixed legacy array", () => {
    const custom: CustomDinner = { id: "custom:1", name: "Leftovers", ingredients: [] };
    const result = coerceDinnerSlots(["tacos", { type: "custom", custom }]);
    expect(result).toEqual([
      { type: "recipe", recipeId: "tacos" },
      { type: "custom", custom },
    ]);
  });
});

describe("dinnerSlotId", () => {
  it("returns the recipeId for recipe slots", () => {
    expect(dinnerSlotId({ type: "recipe", recipeId: "tacos" })).toBe("tacos");
  });

  it("returns the custom id for custom slots", () => {
    expect(
      dinnerSlotId({
        type: "custom",
        custom: { id: "custom:abc", name: "Leftovers", ingredients: [] },
      })
    ).toBe("custom:abc");
  });
});

describe("customDinnerToDinner", () => {
  it("fills defaults for missing protein and cook time", () => {
    const dinner = customDinnerToDinner({
      id: "custom:abc",
      name: "Leftovers",
      ingredients: [],
    });
    expect(dinner).toEqual({
      id: "custom:abc",
      name: "Leftovers",
      protein: "varies",
      cookMinutes: 0,
      tags: ["custom"],
      ingredients: [],
    });
  });

  it("preserves provided protein, cook time, and ingredients", () => {
    const dinner = customDinnerToDinner({
      id: "custom:abc",
      name: "Grandma's stew",
      ingredients: ["beef", "carrots"],
      cookMinutes: 45,
      protein: "beef",
    });
    expect(dinner).toEqual({
      id: "custom:abc",
      name: "Grandma's stew",
      protein: "beef",
      cookMinutes: 45,
      tags: ["custom"],
      ingredients: ["beef", "carrots"],
    });
  });
});
