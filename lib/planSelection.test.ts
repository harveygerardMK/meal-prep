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

  it("can return different dinners across regenerations when unlocked", () => {
    const catalog: Dinner[] = [
      ...dinners,
      {
        id: "fish-a",
        name: "Fish A",
        protein: "fish",
        cookMinutes: 20,
        tags: ["quick"],
        ingredients: [],
      },
      {
        id: "veg-a",
        name: "Veg A",
        protein: "vegetarian",
        cookMinutes: 25,
        tags: ["vegetarian"],
        ingredients: [],
      },
      {
        id: "turkey-a",
        name: "Turkey A",
        protein: "turkey",
        cookMinutes: 30,
        tags: ["weeknight"],
        ingredients: [],
      },
      {
        id: "lamb-a",
        name: "Lamb A",
        protein: "lamb",
        cookMinutes: 35,
        tags: ["favorite"],
        ingredients: [],
      },
    ];

    const results = new Set<string>();
    for (let i = 0; i < 20; i += 1) {
      const picked = pickDinners(
        catalog,
        3,
        40,
        new Set(),
        [null, null, null],
        { cookEffortTarget: 3, noveltyTarget: 3 }
      );
      results.add(picked.join(","));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("prefers avoiding recent ids so regenerate can leave current meals", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const first = pickDinners(
      dinners,
      2,
      40,
      new Set(),
      [null, null],
      { cookEffortTarget: 3, noveltyTarget: 3 }
    );
    const second = pickDinners(
      dinners,
      2,
      40,
      new Set(first),
      [null, null],
      { cookEffortTarget: 3, noveltyTarget: 3 }
    );
    expect(second).not.toEqual(first);
  });

  it("prefers a different protein and tags over another chicken clone for slot 2", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const catalog: Dinner[] = [
      {
        id: "chicken-soup",
        name: "Chicken Noodle Soup",
        protein: "chicken",
        cookMinutes: 30,
        tags: ["soup", "favorite"],
        ingredients: [],
        effortScore: 3,
        noveltyScore: 3,
        seasonCategory: "soup",
      },
      {
        id: "chicken-tacos",
        name: "Chicken Soft Tacos",
        protein: "chicken",
        cookMinutes: 25,
        tags: ["tacos", "favorite"],
        ingredients: [],
        effortScore: 3,
        noveltyScore: 3,
        seasonCategory: "tacos",
      },
      {
        id: "beef-stir-fry",
        name: "Beef Stir Fry",
        protein: "beef",
        cookMinutes: 25,
        tags: ["weeknight"],
        ingredients: [],
        effortScore: 3,
        noveltyScore: 3,
        seasonCategory: "none",
      },
    ];
    const result = pickDinners(
      catalog,
      2,
      40,
      new Set(),
      ["chicken-soup", null],
      { cookEffortTarget: 3, noveltyTarget: 3 }
    );
    expect(result[0]).toBe("chicken-soup");
    expect(result[1]).toBe("beef-stir-fry");
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
