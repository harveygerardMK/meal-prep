import { describe, expect, it } from "vitest";
import { buildGroceryList } from "./groceryList";
import type { ResolvedWeekPlan } from "./types";

function planFixture(overrides: Partial<ResolvedWeekPlan> = {}): ResolvedWeekPlan {
  return {
    weekOf: "2026-07-13",
    dinners: [
      {
        id: "tacos",
        name: "Tacos",
        protein: "beef",
        cookMinutes: 25,
        tags: [],
        ingredients: ["1 lb ground beef", "8 small tortillas", "1 cup shredded cheese", "1 avocado"],
      },
    ],
    girlLunch: {
      id: "turkey-cheese-crackers",
      name: "Turkey, Cheese & Crackers Plate",
      ingredients: ["Sliced turkey", "Baby carrots"],
    },
    boyLunch: {
      id: "pbj",
      name: "PB&J",
      ingredients: ["Peanut butter", "Sandwich bread"],
    },
    locks: { dinners: [null], girlLunch: null, boyLunch: null },
    preferences: { cookEffortTarget: 3, noveltyTarget: 3 },
    miscGrocery: [],
    ...overrides,
  };
}

describe("buildGroceryList", () => {
  it("groups ingredients into store sections", () => {
    const sections = buildGroceryList(planFixture());
    const names = sections.map((s) => s.section);
    expect(names).toContain("Meat & Seafood");
    expect(names).toContain("Bakery & Bread");
    expect(names).toContain("Dairy & Eggs");
    expect(names).toContain("Produce");
  });

  it("merges the same core ingredient from multiple sources", () => {
    const sections = buildGroceryList(
      planFixture({
        dinners: [
          {
            id: "a",
            name: "Dinner A",
            protein: "chicken",
            cookMinutes: 20,
            tags: [],
            ingredients: ["1 cup shredded cheese"],
          },
          {
            id: "b",
            name: "Dinner B",
            protein: "beef",
            cookMinutes: 20,
            tags: [],
            ingredients: ["2 cups shredded cheese"],
          },
        ],
        girlLunch: { id: "g", name: "G", ingredients: [] },
        boyLunch: { id: "b-lunch", name: "B", ingredients: [] },
      })
    );
    const dairy = sections.find((s) => s.section === "Dairy & Eggs");
    const cheese = dairy?.items.find((i) => i.name.toLowerCase().includes("cheese"));
    expect(cheese?.entries).toHaveLength(2);
  });

  it("labels lunch sources as five weekday repeats", () => {
    const sections = buildGroceryList(planFixture());
    const allEntries = sections.flatMap((s) => s.items.flatMap((i) => i.entries));
    expect(allEntries.some((e) => e.source.includes("Girl lunch ×5"))).toBe(true);
    expect(allEntries.some((e) => e.source.includes("Boy lunch ×5"))).toBe(true);
  });

  it("appends household miscellaneous items in their own section", () => {
    const sections = buildGroceryList(
      planFixture({
        miscGrocery: [
          {
            id: "misc-1",
            name: "Paper towels",
            note: "Bounty mega",
            addedAt: "2026-07-15T12:00:00.000Z",
          },
        ],
      })
    );
    const misc = sections.find((s) => s.section === "Miscellaneous");
    expect(misc?.items).toHaveLength(1);
    expect(misc?.items[0]?.name).toBe("Paper towels");
    expect(misc?.items[0]?.miscId).toBe("misc-1");
    expect(misc?.items[0]?.checkKey).toBe("misc:misc-1");
  });

  it("merges staples into store sections when enabled", () => {
    const sections = buildGroceryList(planFixture(), {
      includeStaples: true,
      staples: [{ id: "s1", name: "Milk", section: "Dairy & Eggs" }],
    });
    const dairy = sections.find((s) => s.section === "Dairy & Eggs");
    expect(dairy?.items.some((i) => i.name === "Milk")).toBe(true);
    expect(sections.find((s) => s.section === "Miscellaneous")?.items.some((i) => i.name === "Milk")).toBeFalsy();
  });

  it("omits staples when disabled without dropping misc", () => {
    const sections = buildGroceryList(
      planFixture({
        miscGrocery: [
          { id: "m1", name: "Paper towels", addedAt: "2026-07-19T00:00:00.000Z" },
        ],
      }),
      { includeStaples: false, staples: [{ id: "s1", name: "Milk", section: "Dairy & Eggs" }] }
    );
    expect(sections.flatMap((s) => s.items).some((i) => i.name === "Milk")).toBe(false);
    expect(sections.find((s) => s.section === "Miscellaneous")?.items[0]?.name).toBe(
      "Paper towels"
    );
  });

  it("uses a staple's explicit section when it merges with an ingredient", () => {
    const sections = buildGroceryList(
      planFixture({
        dinners: [
          {
            id: "beans",
            name: "Beans",
            protein: "vegetarian",
            cookMinutes: 20,
            tags: [],
            ingredients: ["1 can beans"],
          },
        ],
        girlLunch: { id: "g", name: "G", ingredients: [] },
        boyLunch: { id: "b", name: "B", ingredients: [] },
      }),
      { includeStaples: true, staples: [{ id: "s1", name: "Beans", section: "Other" }] }
    );
    const beans = sections.find((s) => s.section === "Other")?.items.find((i) => i.name === "Beans");
    expect(beans?.entries.some((entry) => entry.source === "Household staple")).toBe(true);
  });
});
