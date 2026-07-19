export type ExtractedRecipeDraft = {
  name: string;
  ingredients: string[];
  instructions: string[];
  protein?: string;
  cookMinutes?: number;
  confidence: number;
  missingFields: string[];
};

export function extractRecipeFromText(input: {
  titleHint?: string;
  text: string;
}): ExtractedRecipeDraft {
  const lines = input.text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ingredientLines = lines.filter((line) =>
    /^[-*•]|\b(cup|tbsp|tsp|lb|oz|clove|can|pack)\b/i.test(line)
  );
  const instructionLines = lines.filter((line) => /^\d+[\).]/.test(line));

  const name =
    input.titleHint?.trim() ||
    lines.find((line) => !/ingredient|step|direction/i.test(line)) ||
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
