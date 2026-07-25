import { randomUUID } from "crypto";
import { fetchTikTokOEmbed } from "./tiktokOEmbed";
import { extractRecipeDraft } from "./structureImport";
import type { RecipeImport } from "./types";
import { getImport, saveImport } from "@/lib/repositories/importRepository";
import { saveCatalogRecipe } from "@/lib/repositories/recipeRepository";
import { parseCatalogRecipeInput } from "@/lib/recipes/recipeValidation";
import { addRecipeToCurrentWeek } from "@/lib/planGenerator";
import type { MealKind } from "@/lib/types";

export async function createTikTokImport(input: {
  url: string;
  notes?: string;
  kind?: MealKind;
}): Promise<RecipeImport> {
  const now = new Date().toISOString();
  const oembed = await fetchTikTokOEmbed(input.url);
  const text = [oembed?.title, input.notes].filter(Boolean).join("\n");
  const extracted = await extractRecipeDraft({
    titleHint: oembed?.title,
    text: text || input.url,
  });

  const item: RecipeImport = {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    status: "needs_review",
    sourceUrl: input.url,
    oembedTitle: oembed?.title,
    oembedAuthor: oembed?.authorName,
    thumbnailUrl: oembed?.thumbnailUrl,
    notes: input.notes,
    draft: {
      ...extracted,
      kind: input.kind ?? "dinner",
      protein: extracted.protein ?? "varies",
      cookMinutes: extracted.cookMinutes ?? 30,
    },
    error: oembed
      ? undefined
      : "Could not load TikTok metadata; review using your notes.",
  };

  return saveImport(item);
}

export async function updateImportDraft(
  id: string,
  draft: RecipeImport["draft"]
): Promise<RecipeImport> {
  const existing = await getImport(id);
  if (!existing) throw new Error("Import not found");
  const updated: RecipeImport = {
    ...existing,
    draft,
    updatedAt: new Date().toISOString(),
    status: "needs_review",
  };
  return saveImport(updated);
}

export async function approveImport(
  id: string,
  options?: { addToThisWeek?: boolean }
): Promise<RecipeImport> {
  const existing = await getImport(id);
  if (!existing) throw new Error("Import not found");

  const recipe = parseCatalogRecipeInput(
    {
      kind: existing.draft.kind,
      name: existing.draft.name,
      protein: existing.draft.protein,
      cookMinutes: existing.draft.cookMinutes,
      ingredients: existing.draft.ingredients,
      instructions: existing.draft.instructions,
      tags: ["tiktok", "imported"],
      status: "active",
      favorite: false,
      effortScore: 3,
      noveltyScore: 4,
      source: { type: "tiktok", url: existing.sourceUrl },
    },
    { requireId: false }
  );

  const saved = await saveCatalogRecipe(recipe);

  if (options?.addToThisWeek) {
    await addRecipeToCurrentWeek(saved.id);
  }

  const updated: RecipeImport = {
    ...existing,
    status: "approved",
    approvedRecipeId: saved.id,
    updatedAt: new Date().toISOString(),
  };
  return saveImport(updated);
}
