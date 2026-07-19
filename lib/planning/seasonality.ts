import type { SeasonCategory } from "@/lib/types";

export type { SeasonCategory } from "@/lib/types";

const MONTHLY_MENTIONS: Record<SeasonCategory, readonly number[]> = {
  soup: [7, 4, 7, 3, 1, 0, 2, 3, 6, 12, 7, 6],
  grill: [5, 8, 14, 13, 9, 14, 13, 6, 3, 10, 2, 2],
  tacos: [8, 5, 9, 5, 5, 6, 7, 2, 5, 6, 4, 7],
  pasta: [8, 6, 12, 11, 5, 11, 9, 9, 9, 9, 6, 5],
};

/**
 * Soft penalty/bonus added to dinner scoring; lower is more likely.
 * Monthly history counts from 0–15 map to +0.4 through -0.6.
 */
export function seasonScoreAdjustment(
  category: SeasonCategory | "none" | undefined,
  monthIndex: number
): number {
  if (!category || category === "none") return 0;

  const mentions = MONTHLY_MENTIONS[category][monthIndex];
  return 0.4 - mentions / 15;
}
