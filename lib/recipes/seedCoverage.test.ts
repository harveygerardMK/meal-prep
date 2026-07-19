import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const REQUIRED_IDS = [
  "grilled-cheese-tomato-soup",
  "gnocchi-arugula-feta",
  "eamon-bec-gnocchi-soup",
  "kielbasa-soup",
  "lemon-butter-chicken-orzo",
  "tamales",
  "dumplings",
  "brats-corn",
  "adobo-cauliflower",
  "taco-cups",
  "udon",
];

describe("family favorite seed coverage", () => {
  it("includes all historically missing dinners", () => {
    const raw = JSON.parse(
      readFileSync(path.join(process.cwd(), "data/recipes.json"), "utf-8")
    );
    const dinners = raw.dinners ?? raw.recipes?.filter((r: { kind: string }) => r.kind === "dinner");
    const ids = new Set(dinners.map((d: { id: string }) => d.id));
    for (const id of REQUIRED_IDS) {
      expect(ids.has(id), `missing ${id}`).toBe(true);
    }
  });
});
