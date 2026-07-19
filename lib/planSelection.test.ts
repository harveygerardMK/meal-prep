import { describe, expect, it, vi, afterEach } from "vitest";
import { pickDinners, pickLunch } from "./planSelection";
import type { Dinner, LunchOption } from "./types";

const dinners: Dinner[] = [
  {
    id: "chicken-a",
    name: "Chicken A",
    protein: "chicken",
    cookMinutes: 20,
    tags: [],
    ingredients: [],
  },
  {
    id: "beef-a",
    name: "Beef A",
    protein: "beef",
    cookMinutes: 25,
    tags: [],
    ingredients: [],
  },
  {
    id: "pork-a",
    name: "Pork A",
    protein: "pork",
    cookMinutes: 30,
    tags: [],
    ingredients: [],
  },
  {
    id: "slow-roast",
    name: "Slow Roast",
    protein: "beef",
    cookMinutes: 90,
    tags: [],
    ingredients: [],
  },
];

const lunches: LunchOption[] = [
  { id: "lunch-1", name: "Lunch 1", ingredients: [] },
  { id: "lunch-2", name: "Lunch 2", ingredients: [] },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("pickDinners", () => {
  it("preserves locked dinner ids", () => {
    const result = pickDinners(dinners, 2, 40, new Set(), ["beef-a", null]);
    expect(result[0]).toBe("beef-a");
    expect(result[1]).toBeTruthy();
    expect(result[1]).not.toBe("beef-a");
  });

  it("excludes dinners over the max cook time", () => {
    const result = pickDinners(dinners, 3, 40, new Set(), [null, null, null]);
    expect(result).not.toContain("slow-roast");
    expect(result).toHaveLength(3);
  });

  it("prefers unused proteins when available", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const result = pickDinners(dinners, 3, 40, new Set(), [null, null, null]);
    const proteins = result.map((id) => dinners.find((d) => d.id === id)!.protein);
    expect(new Set(proteins).size).toBe(3);
  });

  it("avoids recent ids when fresher options remain", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const result = pickDinners(
      dinners,
      1,
      40,
      new Set(["chicken-a", "beef-a"]),
      [null]
    );
    expect(result[0]).toBe("pork-a");
  });

  it("fills empty slots with priority queue ids first", () => {
    const result = pickDinners(
      dinners,
      2,
      40,
      new Set(),
      [null, null],
      { cookEffortTarget: 3, noveltyTarget: 3 },
      ["pork-a"]
    );
    expect(result[0]).toBe("pork-a");
    expect(result[1]).toBeTruthy();
  });
});

describe("pickLunch", () => {
  it("returns a locked lunch id", () => {
    expect(pickLunch(lunches, new Set(), "lunch-2")).toBe("lunch-2");
  });

  it("prefers options outside the avoid set", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickLunch(lunches, new Set(["lunch-1"]), null)).toBe("lunch-2");
  });

  it("falls back to the full pool when all options were recent", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickLunch(lunches, new Set(["lunch-1", "lunch-2"]), null)).toBe("lunch-1");
  });

  it("throws when there are no lunch options", () => {
    expect(() => pickLunch([], new Set(), null)).toThrow(/no lunch options/i);
  });
});
