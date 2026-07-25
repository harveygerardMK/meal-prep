import { AiUnavailableError, runJsonPrompt } from "./workersAi";
import { inventDinnerPrompt } from "./prompts";
import type { WeekPreferences } from "@/lib/types";

export type InventedDinnerDraft = {
  name: string;
  protein: string;
  cookMinutes: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateInventedDinner(
  raw: unknown,
  maxCookMinutes: number
): InventedDinnerDraft {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI dinner draft was empty");
  }
  const body = raw as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const protein = typeof body.protein === "string" ? body.protein.trim() : "";
  const cookMinutes =
    typeof body.cookMinutes === "number" && Number.isFinite(body.cookMinutes)
      ? Math.round(body.cookMinutes)
      : NaN;
  const ingredients = asStringArray(body.ingredients);
  const instructions = asStringArray(body.instructions);
  const tags = asStringArray(body.tags);

  if (!name) throw new Error("AI dinner missing name");
  if (!protein) throw new Error("AI dinner missing protein");
  if (!Number.isInteger(cookMinutes) || cookMinutes < 1) {
    throw new Error("AI dinner missing cookMinutes");
  }
  if (ingredients.length < 2) {
    throw new Error("AI dinner needs at least two ingredients");
  }
  if (cookMinutes > maxCookMinutes) {
    throw new Error(
      `AI dinner cookMinutes ${cookMinutes} exceeds max ${maxCookMinutes}`
    );
  }

  return {
    name,
    protein,
    cookMinutes,
    ingredients,
    instructions: instructions.length > 0 ? instructions : ["Cook and serve."],
    tags,
  };
}

export async function inventDinnerForWeek(input: {
  avoidNames: string[];
  maxCookMinutes: number;
  preferences: WeekPreferences;
}): Promise<InventedDinnerDraft> {
  const raw = await runJsonPrompt<unknown>(inventDinnerPrompt(input), {
    system: "You are a practical home-cooking meal planner. Reply with JSON only.",
    maxTokens: 1400,
  });
  return validateInventedDinner(raw, input.maxCookMinutes);
}

export { AiUnavailableError };
