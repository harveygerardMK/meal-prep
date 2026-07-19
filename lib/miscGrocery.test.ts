import { describe, expect, it } from "vitest";
import { parseMiscGroceryName, parseMiscGroceryNote } from "./miscGroceryParse";

describe("parseMiscGroceryName", () => {
  it("trims and collapses whitespace", () => {
    expect(parseMiscGroceryName("  paper   towels ")).toBe("paper towels");
  });

  it("rejects empty names", () => {
    expect(() => parseMiscGroceryName("   ")).toThrow(/1–80/);
  });
});

describe("parseMiscGroceryNote", () => {
  it("returns undefined for blank notes", () => {
    expect(parseMiscGroceryNote("")).toBeUndefined();
    expect(parseMiscGroceryNote(null)).toBeUndefined();
  });

  it("keeps a short note", () => {
    expect(parseMiscGroceryNote("  2-pack ")).toBe("2-pack");
  });
});
