import type { Dinner, WeekPreferences } from "@/lib/types";
import { seasonScoreAdjustment } from "./seasonality";

/** Soft stop-words ignored when comparing dinner name tokens. */
const NAME_STOP = new Set([
  "a",
  "an",
  "and",
  "the",
  "with",
  "in",
  "of",
  "for",
  "to",
  "style",
]);

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

export function nameTokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !NAME_STOP.has(token))
  );
}

/**
 * Extra cost for looking too similar to dinners already on this week.
 * Lower base scores are still better; this only adds penalties.
 */
export function withinWeekDiversityPenalty(
  dinner: Dinner,
  pickedSoFar: Dinner[]
): number {
  if (pickedSoFar.length === 0) return 0;

  let penalty = 0;
  const candidateTags = new Set((dinner.tags ?? []).map((t) => t.toLowerCase()));
  const candidateTokens = nameTokens(dinner.name);
  const candidateSeason =
    dinner.seasonCategory && dinner.seasonCategory !== "none"
      ? dinner.seasonCategory
      : null;

  for (const other of pickedSoFar) {
    if (other.protein && dinner.protein && other.protein === dinner.protein) {
      penalty += 1.5;
    }
    if (
      candidateSeason &&
      other.seasonCategory &&
      other.seasonCategory !== "none" &&
      other.seasonCategory === candidateSeason
    ) {
      penalty += 1.25;
    }

    const otherTags = new Set((other.tags ?? []).map((t) => t.toLowerCase()));
    let tagOverlap = 0;
    for (const tag of candidateTags) {
      if (otherTags.has(tag)) tagOverlap += 1;
    }
    if (tagOverlap > 0) penalty += Math.min(tagOverlap * 0.4, 1.2);

    const otherTokens = nameTokens(other.name);
    let tokenOverlap = 0;
    for (const token of candidateTokens) {
      if (otherTokens.has(token)) tokenOverlap += 1;
    }
    if (tokenOverlap > 0) penalty += Math.min(tokenOverlap * 0.75, 2);
  }

  return penalty;
}

/** Lower scores are better. */
export function scoreDinnerCandidate(
  dinner: Dinner,
  preferences: WeekPreferences,
  avoidIds: Set<string>,
  monthIndex?: number,
  pickedSoFar: Dinner[] = []
): number {
  const effort = effectiveEffort(dinner);
  const novelty = effectiveNovelty(dinner);
  const effortDistance = Math.abs(effort - preferences.cookEffortTarget);
  const noveltyDistance = Math.abs(novelty - preferences.noveltyTarget);
  // Stronger than the old 2.5 soft nudge so regenerate leaves current meals behind
  // when fresher options remain.
  const recentPenalty = avoidIds.has(dinner.id) ? 4 : 0;
  const seasonalAdjustment =
    monthIndex === undefined ? 0 : seasonScoreAdjustment(dinner.seasonCategory, monthIndex);
  const diversityPenalty = withinWeekDiversityPenalty(dinner, pickedSoFar);
  return (
    effortDistance +
    noveltyDistance +
    recentPenalty +
    seasonalAdjustment +
    diversityPenalty
  );
}
