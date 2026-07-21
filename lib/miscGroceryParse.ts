import {
  MISC_DESTINATION_SECTIONS,
  type MiscGrocerySection,
} from "./types";

export function parseMiscGroceryName(input: unknown): string {
  if (typeof input !== "string") {
    throw new Error("Invalid name: expected a string");
  }
  const name = input.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 80) {
    throw new Error("Invalid name: use 1–80 characters");
  }
  return name;
}

export function parseMiscGroceryNote(input: unknown): string | undefined {
  if (input === undefined || input === null || input === "") return undefined;
  if (typeof input !== "string") {
    throw new Error("Invalid note: expected a string");
  }
  const note = input.trim().replace(/\s+/g, " ");
  if (note.length > 120) {
    throw new Error("Invalid note: use at most 120 characters");
  }
  return note || undefined;
}

export function parseMiscGrocerySection(input: unknown): MiscGrocerySection {
  if (input === undefined || input === null || input === "") {
    return "Miscellaneous";
  }
  if (
    typeof input !== "string" ||
    !(MISC_DESTINATION_SECTIONS as readonly string[]).includes(input)
  ) {
    throw new Error(
      "Invalid section: use Miscellaneous, Amazon, or Costco"
    );
  }
  return input as MiscGrocerySection;
}
