import { describe, expect, it } from "vitest";
import { parseLocks, parseSettings } from "./validation";

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
