import { runJsonPrompt } from "@/lib/ai/workersAi";
import { structureImportPrompt } from "@/lib/ai/prompts";
import {
  extractRecipeFromText,
  type ExtractedRecipeDraft,
} from "./extractRecipeFromText";

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function draftFromAiStructure(raw: unknown): ExtractedRecipeDraft {
  if (!raw || typeof raw !== "object") {
    throw new Error("AI import draft was empty");
  }
  const body = raw as Record<string, unknown>;
  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "Imported recipe";
  const ingredients = asStringArray(body.ingredients);
  const instructions = asStringArray(body.instructions);
  const protein =
    typeof body.protein === "string" && body.protein.trim()
      ? body.protein.trim()
      : undefined;
  const cookMinutes =
    typeof body.cookMinutes === "number" &&
    Number.isInteger(body.cookMinutes) &&
    body.cookMinutes > 0
      ? body.cookMinutes
      : undefined;

  const missingFields: string[] = [];
  if (ingredients.length === 0) missingFields.push("ingredients");
  if (instructions.length === 0) missingFields.push("instructions");

  let confidence = 0.55;
  if (ingredients.length >= 2) confidence += 0.25;
  if (instructions.length >= 1) confidence += 0.1;
  if (name !== "Imported recipe") confidence += 0.05;

  return {
    name,
    ingredients,
    instructions,
    protein,
    cookMinutes,
    confidence: Math.min(confidence, 0.98),
    missingFields,
  };
}

/**
 * Prefer Workers AI structuring; fall back to heuristic line/prose parsing.
 */
export async function extractRecipeDraft(input: {
  titleHint?: string;
  text: string;
}): Promise<ExtractedRecipeDraft> {
  const heuristic = extractRecipeFromText(input);
  try {
    const raw = await runJsonPrompt<unknown>(structureImportPrompt(input), {
      system: "You extract structured recipes from captions. Reply with JSON only.",
      maxTokens: 1000,
    });
    const aiDraft = draftFromAiStructure(raw);
    // If AI produced nothing useful, keep the heuristic result.
    if (aiDraft.ingredients.length === 0 && heuristic.ingredients.length > 0) {
      return { ...heuristic, confidence: Math.max(heuristic.confidence, 0.45) };
    }
    return aiDraft;
  } catch {
    return heuristic;
  }
}
