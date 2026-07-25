export type ExtractedRecipeDraft = {
  name: string;
  ingredients: string[];
  instructions: string[];
  protein?: string;
  cookMinutes?: number;
  confidence: number;
  missingFields: string[];
};

const MEASURE =
  /\b(\d+[\d\/.\s-]*)\s*(cups?|cup|tbsps?|tbsp|tsps?|tsp|lbs?|lb|oz|cloves?|cans?|packs?|package|g|kg|ml|l)\b/i;

function looksLikeIngredient(line: string): boolean {
  return /^[-*•]/.test(line) || MEASURE.test(line);
}

/**
 * Split a caption paragraph into candidate ingredient phrases when there are
 * no newlines — e.g. "1 lb chicken, 2 cups rice and 1 tbsp oil".
 */
export function splitProseIngredients(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const parts = cleaned
    .split(/\s*(?:,|;|\band\b)\s*/i)
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.filter((part) => looksLikeIngredient(part) || MEASURE.test(part));
}

export function extractRecipeFromText(input: {
  titleHint?: string;
  text: string;
}): ExtractedRecipeDraft {
  const lines = input.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let ingredientLines = lines.filter((line) => looksLikeIngredient(line));
  const instructionLines = lines.filter((line) => /^\d+[\).]/.test(line));

  // A single long caption line often matches MEASURE once; prefer splitting it.
  const shouldSplitProse =
    ingredientLines.length === 0 ||
    (ingredientLines.length === 1 &&
      /[,;]|\band\b/i.test(ingredientLines[0]) &&
      ingredientLines[0].length > 40);

  if (shouldSplitProse) {
    const prose = splitProseIngredients(input.text);
    if (prose.length > ingredientLines.length) {
      ingredientLines = prose;
    }
  }

  const name =
    input.titleHint?.trim() ||
    lines.find((line) => !/ingredient|step|direction/i.test(line) && !looksLikeIngredient(line)) ||
    "Imported recipe";

  const missingFields: string[] = [];
  if (ingredientLines.length === 0) missingFields.push("ingredients");
  if (instructionLines.length === 0) missingFields.push("instructions");

  let confidence = 0.25;
  if (ingredientLines.length >= 2) confidence += 0.35;
  if (instructionLines.length >= 2) confidence += 0.25;
  if (name && name !== "Imported recipe") confidence += 0.1;

  return {
    name,
    ingredients: ingredientLines.map((line) => line.replace(/^[-*•]\s*/, "")),
    instructions: instructionLines.map((line) => line.replace(/^\d+[\).]\s*/, "")),
    confidence: Math.min(confidence, 0.95),
    missingFields,
  };
}
