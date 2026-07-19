import { describe, expect, it } from "vitest";
import { buildShoppingHandoff } from "./handoff";
import type { GrocerySection } from "@/lib/groceryList";

const sections: GrocerySection[] = [
  {
    section: "Produce",
    items: [
      {
        name: "Garlic",
        entries: [{ text: "4 cloves garlic", source: "Pasta" }],
      },
    ],
  },
];

describe("buildShoppingHandoff", () => {
  it("creates Instacart and Google search links for each grocery item", () => {
    const handoff = buildShoppingHandoff(sections, { instacartEnabled: false });
    expect(handoff.items).toHaveLength(1);
    expect(handoff.items[0].name).toBe("Garlic");
    expect(handoff.items[0].instacartSearchUrl.toLowerCase()).toContain("garlic");
    expect(handoff.items[0].googleSearchUrl).toContain("google.com/search");
    expect(decodeURIComponent(handoff.items[0].googleSearchUrl).toLowerCase()).toContain(
      "instacart garlic"
    );
    expect(handoff.mode).toBe("export");
  });

  it("reports landing-page mode when Instacart API flag is enabled", () => {
    const handoff = buildShoppingHandoff(sections, {
      instacartEnabled: true,
      instacartApiKeyPresent: true,
    });
    expect(handoff.mode).toBe("instacart_landing");
  });
});
