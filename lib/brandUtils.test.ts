import { describe, expect, it } from "vitest";
import { photoMonogram } from "../app/components/brand/EmptyPhoto";
import { uniqueMetaItems } from "../app/components/brand/MetaRow";

describe("photoMonogram", () => {
  it("skips filler words so Air Fryer recipes are not all A", () => {
    expect(photoMonogram("Air Fryer Sesame Chicken & Rice")).toBe("SR");
    expect(photoMonogram("Air Fryer Tilapia & Asparagus")).toBe("TA");
  });

  it("uses a single letter for one significant word", () => {
    expect(photoMonogram("Tacos")).toBe("T");
  });
});

describe("uniqueMetaItems", () => {
  it("drops case-insensitive duplicates while keeping order", () => {
    expect(
      uniqueMetaItems(["20 min", "fish", "fish", "quick", "Fish"])
    ).toEqual(["20 min", "fish", "quick"]);
  });
});
