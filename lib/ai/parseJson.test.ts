import { describe, expect, it } from "vitest";
import { extractJsonText, parseJsonFromModel } from "./parseJson";

describe("extractJsonText", () => {
  it("strips markdown fences", () => {
    const raw = '```json\n{"name":"Soup"}\n```';
    expect(extractJsonText(raw)).toBe('{"name":"Soup"}');
  });

  it("slices the first object when prose surrounds it", () => {
    const raw = 'Sure!\n{"name":"Tacos","ingredients":["1 lb beef"]}\nEnjoy';
    expect(extractJsonText(raw)).toBe(
      '{"name":"Tacos","ingredients":["1 lb beef"]}'
    );
  });
});

describe("parseJsonFromModel", () => {
  it("parses fenced JSON", () => {
    expect(parseJsonFromModel<{ name: string }>('```\n{"name":"Chili"}\n```')).toEqual({
      name: "Chili",
    });
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJsonFromModel("not json")).toThrow(/invalid JSON/i);
  });
});
