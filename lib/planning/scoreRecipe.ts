import type { Dinner, WeekPreferences } from "@/lib/types";
import { seasonScoreAdjustment } from "./seasonality";

/** Infer effort 1–5 from cook time and tags when catalog scores are flat. */
export function inferEffortScore(dinner: Pick<Dinner, "cookMinutes" | "tags">): number {
  const tags = new Set((dinner.tags ?? []).map((t) => t.toLowerCase()));
  if (tags.has("no-cook") || tags.has("low-effort")) return 1;
  const mins = dinner.cookMinutes ?? 30;
  if (mins <= 15 || tags.has("quick")) return 2;
  if (mins <= 30 || tags.has("weeknight") || tags.has("air-fryer")) return 3;
  if (mins <= 45) return 4;
  return 5;
}

/** Infer originality 1–5 from tags when catalog scores are flat. */
export function inferNoveltyScore(dinner: Pick<Dinner, "tags">): number {
  const tags = new Set((dinner.tags ?? []).map((t) => t.toLowerCase()));
  if (tags.has("favorite") || tags.has("familiar") || tags.has("leftovers")) return 1;
  if (tags.has("classic") || tags.has("kid-friendly")) return 2;
  if (tags.has("add-more-variety") || tags.has("new") || tags.has("adventurous")) {
    return 5;
  }
  if (tags.has("vegetarian") || tags.has("vegan") || tags.has("szechuan")) return 4;
  return 3;
}

function effectiveEffort(dinner: Dinner): number {
  const stored = dinner.effortScore ?? 3;
  const inferred = inferEffortScore(dinner);
  // Blend so flat catalog 3/3 still responds to cook-time/tag signal.
  return (stored + inferred) / 2;
}

function effectiveNovelty(dinner: Dinner): number {
  const stored = dinner.noveltyScore ?? 3;
  const inferred = inferNoveltyScore(dinner);
  return (stored + inferred) / 2;
}

/** Lower scores are better. */
export function scoreDinnerCandidate(
  dinner: Dinner,
  preferences: WeekPreferences,
  avoidIds: Set<string>,
  monthIndex?: number
): number {
  const effort = effectiveEffort(dinner);
  const novelty = effectiveNovelty(dinner);
  const effortDistance = Math.abs(effort - preferences.cookEffortTarget);
  const noveltyDistance = Math.abs(novelty - preferences.noveltyTarget);
  const recentPenalty = avoidIds.has(dinner.id) ? 2.5 : 0;
  const seasonalAdjustment =
    monthIndex === undefined ? 0 : seasonScoreAdjustment(dinner.seasonCategory, monthIndex);
  return effortDistance + noveltyDistance + recentPenalty + seasonalAdjustment;
}
