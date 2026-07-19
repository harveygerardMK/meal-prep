import type { Dinner, WeekPreferences } from "@/lib/types";

/** Lower scores are better. */
export function scoreDinnerCandidate(
  dinner: Dinner,
  preferences: WeekPreferences,
  avoidIds: Set<string>
): number {
  const effort = dinner.effortScore ?? 3;
  const novelty = dinner.noveltyScore ?? 3;
  const effortDistance = Math.abs(effort - preferences.cookEffortTarget);
  const noveltyDistance = Math.abs(novelty - preferences.noveltyTarget);
  const recentPenalty = avoidIds.has(dinner.id) ? 2.5 : 0;
  return effortDistance + noveltyDistance + recentPenalty;
}
