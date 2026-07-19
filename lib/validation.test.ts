import { describe, expect, it } from "vitest";
import { parseCustomDinnerInput, parseLocks, parseSettings } from "./validation";

describe("parseSettings", () => {
  it("accepts valid settings", () => {
    expect(
      parseSettings({
        dinnersPerWeek: 4,
        maxCookMinutes: 40,
        noRepeatWeeks: 3,
        servings: 4,
      })
    ).toEqual({
      dinnersPerWeek: 4,
      maxCookMinutes: 40,
      noRepeatWeeks: 3,
      servings: 4,
      cookEffortTarget: 3,
      noveltyTarget: 3,
      includeStaplesInGroceryList: true,
    });
  });

  it("rejects non-objects", () => {
    expect(() => parseSettings(null)).toThrow(/settings/i);
    expect(() => parseSettings("x")).toThrow(/settings/i);
  });

  it("rejects non-positive integers", () => {
    expect(() =>
      parseSettings({
        dinnersPerWeek: 0,
        maxCookMinutes: 40,
        noRepeatWeeks: 3,
        servings: 4,
      })
    ).toThrow(/dinnersPerWeek/i);

    expect(() =>
      parseSettings({
        dinnersPerWeek: 4,
        maxCookMinutes: 40.5,
        noRepeatWeeks: 3,
        servings: 4,
      })
    ).toThrow(/maxCookMinutes/i);
  });
});

describe("parseLocks", () => {
  it("accepts valid locks", () => {
    expect(
      parseLocks({
        dinners: ["tacos", null, null],
        girlLunch: "mason-jar-salad",
        boyLunch: null,
      })
    ).toEqual({
      dinners: ["tacos", null, null],
      girlLunch: "mason-jar-salad",
      boyLunch: null,
    });
  });

  it("rejects missing dinners array", () => {
    expect(() =>
      parseLocks({ girlLunch: null, boyLunch: null })
    ).toThrow(/dinners/i);
  });

  it("rejects non-string lock ids", () => {
    expect(() =>
      parseLocks({
        dinners: [123],
        girlLunch: null,
        boyLunch: null,
      })
    ).toThrow(/dinner lock/i);
  });
});

describe("parseCustomDinnerInput", () => {
  it("accepts a minimal custom dinner with no ingredients", () => {
    expect(parseCustomDinnerInput({ index: 0, name: "Leftovers" })).toEqual({
      index: 0,
      name: "Leftovers",
      ingredients: [],
      cookMinutes: undefined,
      protein: undefined,
    });
  });

  it("accepts a full custom dinner", () => {
    expect(
      parseCustomDinnerInput({
        index: 2,
        name: "Grandma's stew",
        ingredients: ["beef", "carrots", ""],
        cookMinutes: 45,
        protein: "beef",
      })
    ).toEqual({
      index: 2,
      name: "Grandma's stew",
      ingredients: ["beef", "carrots"],
      cookMinutes: 45,
      protein: "beef",
    });
  });

  it("rejects a negative index", () => {
    expect(() => parseCustomDinnerInput({ index: -1, name: "X" })).toThrow(/index/i);
  });

  it("rejects a missing name", () => {
    expect(() => parseCustomDinnerInput({ index: 0 })).toThrow(/name/i);
  });

  it("rejects non-string ingredients", () => {
    expect(() =>
      parseCustomDinnerInput({ index: 0, name: "X", ingredients: [1, 2] })
    ).toThrow(/ingredients/i);
  });
});
