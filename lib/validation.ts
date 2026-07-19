import type {
  GrocerySectionName,
  Locks,
  Settings,
  StaplesData,
  WeekPreferences,
} from "./types";

const GROCERY_SECTIONS: GrocerySectionName[] = [
  "Produce",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Bakery & Bread",
  "Frozen",
  "Pantry & Dry Goods",
  "Other",
];

function requirePositiveInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    throw new Error(`Invalid ${field}: expected a positive integer`);
  }
  return value;
}

function requireScore(value: unknown, field: string, fallback = 3): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`Invalid ${field}: expected an integer from 1 to 5`);
  }
  return value;
}

function requireNullableId(value: unknown, field: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid ${field}: expected a string id or null`);
  }
  return value;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid ${field}: expected a non-empty string`);
  }
  return value.trim();
}

export function parseSettings(input: unknown): Settings {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid settings: expected an object");
  }
  const body = input as Record<string, unknown>;
  return {
    dinnersPerWeek: requirePositiveInt(body.dinnersPerWeek, "dinnersPerWeek"),
    maxCookMinutes: requirePositiveInt(body.maxCookMinutes, "maxCookMinutes"),
    noRepeatWeeks: requirePositiveInt(body.noRepeatWeeks, "noRepeatWeeks"),
    servings: requirePositiveInt(body.servings, "servings"),
    cookEffortTarget: requireScore(body.cookEffortTarget, "cookEffortTarget"),
    noveltyTarget: requireScore(body.noveltyTarget, "noveltyTarget"),
    includeStaplesInGroceryList:
      body.includeStaplesInGroceryList === undefined
        ? true
        : typeof body.includeStaplesInGroceryList === "boolean"
          ? body.includeStaplesInGroceryList
          : (() => {
              throw new Error(
                "Invalid includeStaplesInGroceryList: expected a boolean"
              );
            })(),
  };
}

export function parseStaples(input: unknown): StaplesData {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid staples: expected an object");
  }
  const body = input as Record<string, unknown>;
  if (!Array.isArray(body.items)) {
    throw new Error("Invalid staples: items must be an array");
  }
  return {
    items: body.items.map((item, index) => {
      if (!item || typeof item !== "object") {
        throw new Error(`Invalid staple at index ${index}: expected an object`);
      }
      const staple = item as Record<string, unknown>;
      const section = staple.section;
      if (
        typeof section !== "string" ||
        !GROCERY_SECTIONS.includes(section as GrocerySectionName)
      ) {
        throw new Error(`Invalid staple at index ${index}: unknown section`);
      }
      return {
        id: requireString(staple.id, `staple id at index ${index}`),
        name: requireString(staple.name, `staple name at index ${index}`),
        section: section as GrocerySectionName,
      };
    }),
  };
}

export function parseWeekPreferences(
  input: unknown,
  fallback: WeekPreferences
): WeekPreferences {
  if (input === undefined || input === null) return fallback;
  if (!input || typeof input !== "object") {
    throw new Error("Invalid preferences: expected an object");
  }
  const body = input as Record<string, unknown>;
  return {
    cookEffortTarget: requireScore(
      body.cookEffortTarget,
      "cookEffortTarget",
      fallback.cookEffortTarget
    ),
    noveltyTarget: requireScore(
      body.noveltyTarget,
      "noveltyTarget",
      fallback.noveltyTarget
    ),
  };
}

export function parseLocks(input: unknown): Locks {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid locks: expected an object");
  }
  const body = input as Record<string, unknown>;
  if (!Array.isArray(body.dinners)) {
    throw new Error("Invalid locks: dinners must be an array");
  }
  const dinners = body.dinners.map((id, index) =>
    requireNullableId(id, `dinner lock at index ${index}`)
  );
  return {
    dinners,
    girlLunch: requireNullableId(body.girlLunch, "girlLunch"),
    boyLunch: requireNullableId(body.boyLunch, "boyLunch"),
  };
}
