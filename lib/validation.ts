import type { Locks, Settings, WeekPreferences } from "./types";

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
