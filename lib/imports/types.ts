import type { MealKind } from "@/lib/types";
import type { ExtractedRecipeDraft } from "./extractRecipeFromText";

export type ImportStatus =
  | "needs_review"
  | "approved"
  | "failed"
  | "queued";

export type RecipeImport = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: ImportStatus;
  sourceUrl: string;
  oembedTitle?: string;
  oembedAuthor?: string;
  thumbnailUrl?: string;
  notes?: string;
  draft: ExtractedRecipeDraft & {
    kind: MealKind;
    protein?: string;
    cookMinutes?: number;
  };
  approvedRecipeId?: string;
  error?: string;
};

export type PlanQueueItem = {
  id: string;
  weekOf: string;
  recipeId: string;
  sourceImportId?: string;
  createdAt: string;
  status: "pending" | "consumed";
};
