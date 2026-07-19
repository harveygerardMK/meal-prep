import { describe, expect, it } from "vitest";
import { seasonScoreAdjustment } from "./seasonality";

describe("seasonScoreAdjustment", () => {
  it("favors soup in November over June", () => {
    expect(seasonScoreAdjustment("soup", 10)).toBeLessThan(
      seasonScoreAdjustment("soup", 5)
    );
  });

  it("favors grilling in June over November", () => {
    expect(seasonScoreAdjustment("grill", 5)).toBeLessThan(
      seasonScoreAdjustment("grill", 10)
    );
  });

  it("leaves uncategorized dinners unadjusted", () => {
    for (let month = 0; month < 12; month += 1) {
      expect(seasonScoreAdjustment("none", month)).toBe(0);
      expect(seasonScoreAdjustment(undefined, month)).toBe(0);
    }
  });

  it("keeps every adjustment within the soft-score limit", () => {
    const categories = ["soup", "grill", "tacos", "pasta"] as const;
    for (const category of categories) {
      for (let month = 0; month < 12; month += 1) {
        expect(Math.abs(seasonScoreAdjustment(category, month))).toBeLessThanOrEqual(0.75);
      }
    }
  });
});
