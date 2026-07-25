import type { WeekPreferences } from "@/lib/types";

export function inventDinnerPrompt(input: {
  avoidNames: string[];
  maxCookMinutes: number;
  preferences: WeekPreferences;
}): string {
  const avoid =
    input.avoidNames.length > 0
      ? input.avoidNames.map((name) => `- ${name}`).join("\n")
      : "- (none)";

  return `You invent one practical weeknight dinner for a household meal-prep plan.

Constraints:
- Cook time must be ${input.maxCookMinutes} minutes or less.
- Effort target about ${input.preferences.cookEffortTarget}/5 (1=very easy, 5=involved).
- Originality target about ${input.preferences.noveltyTarget}/5 (1=familiar comfort, 5=new).
- Do NOT invent a dish that matches or is a trivial variation of any of these recent/current meals:
${avoid}

Practicality rules:
- Prefer realistic home-cook recipes a normal person would make on a weeknight.
- Keep extra ingredients to common pantry staples (salt, pepper, oil, onion, garlic, spices, lemon, broth).
- Keep the name natural and simple, not restaurant-style.
- Ingredients must include quantities and units (e.g. "1 lb ground turkey", "2 tbsp soy sauce").

Return ONLY valid JSON (no markdown, no backticks) with this exact shape:
{
  "name": "Recipe Name",
  "protein": "chicken|beef|pork|turkey|fish|shrimp|tofu|beans|eggs|varies",
  "cookMinutes": 30,
  "ingredients": ["1 lb ...", "2 cups ..."],
  "instructions": ["Step one.", "Step two."],
  "tags": ["weeknight", "optional-tag"]
}`;
}

export function structureImportPrompt(input: {
  titleHint?: string;
  text: string;
}): string {
  const titleLine = input.titleHint?.trim()
    ? `Title hint: ${input.titleHint.trim()}\n`
    : "";

  return `Extract a cookable recipe draft from this social-media caption / notes.

${titleLine}Source text:
"""
${input.text}
"""

Rules:
- Prefer the title hint when it names a dish; otherwise invent a short clear dish name from the text.
- Pull every ingredient you can find into a list of strings with quantities when present (e.g. "1 cup rice").
- If the text is one unstructured paragraph, still split ingredients into separate list items.
- Instructions are optional; include short steps when present, otherwise use an empty array.
- Guess protein and cookMinutes when reasonable; otherwise use "varies" and 30.
- Do not invent a long ingredient list that is not supported by the text. If almost nothing is food-related, return few or empty ingredients.

Return ONLY valid JSON (no markdown, no backticks) with this exact shape:
{
  "name": "Recipe Name",
  "ingredients": ["1 cup ...", "2 tbsp ..."],
  "instructions": ["Optional step"],
  "protein": "varies",
  "cookMinutes": 30
}`;
}
