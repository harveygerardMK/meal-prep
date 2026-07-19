import { scoreDinnerCandidate } from "./planning/scoreRecipe";
import type { Dinner, LunchOption, WeekPreferences } from "./types";

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Sort by score (lower better), then shuffle within equal-score ties so
 * regenerate is not deterministic when the catalog is mostly 3/3.
 */
function rankDinners(
  dinners: Dinner[],
  preferences: WeekPreferences,
  avoidIds: Set<string>
): Dinner[] {
  const scored = dinners.map((dinner) => ({
    dinner,
    score: scoreDinnerCandidate(dinner, preferences, avoidIds),
  }));
  scored.sort(
    (a, b) => a.score - b.score || a.dinner.id.localeCompare(b.dinner.id)
  );

  const ranked: Dinner[] = [];
  let i = 0;
  while (i < scored.length) {
    let j = i + 1;
    while (j < scored.length && scored[j].score === scored[i].score) j += 1;
    ranked.push(...shuffle(scored.slice(i, j).map((entry) => entry.dinner)));
    i = j;
  }
  return ranked;
}

export function pickDinners(
  allDinners: Dinner[],
  count: number,
  maxCookMinutes: number,
  avoidIds: Set<string>,
  locked: (string | null)[],
  preferences: WeekPreferences = { cookEffortTarget: 3, noveltyTarget: 3 },
  priorityIds: string[] = []
): string[] {
  const result: string[] = locked.slice(0, count).map((id) => id ?? "");
  while (result.length < count) result.push("");

  const usedProteins = new Set<string>();
  const usedIds = new Set<string>();
  for (const id of result) {
    if (!id) continue;
    const d = allDinners.find((x) => x.id === id);
    if (d) {
      usedProteins.add(d.protein);
      usedIds.add(d.id);
    }
  }

  // Fill empty slots with queued/priority recipes first (still respecting cook time).
  for (const priorityId of priorityIds) {
    const emptyIndex = result.findIndex((id) => !id);
    if (emptyIndex < 0) break;
    if (usedIds.has(priorityId)) continue;
    const dinner = allDinners.find(
      (item) => item.id === priorityId && item.cookMinutes <= maxCookMinutes
    );
    if (!dinner) continue;
    result[emptyIndex] = dinner.id;
    usedIds.add(dinner.id);
    usedProteins.add(dinner.protein);
  }

  const withinTime = allDinners.filter((d) => d.cookMinutes <= maxCookMinutes);
  const fresh = rankDinners(
    withinTime.filter((d) => !avoidIds.has(d.id) && !usedIds.has(d.id)),
    preferences,
    avoidIds
  );
  const fallback = rankDinners(
    withinTime.filter((d) => !usedIds.has(d.id)),
    preferences,
    avoidIds
  );

  for (let i = 0; i < count; i++) {
    if (result[i]) continue;

    const choice =
      fresh.find((d) => !usedProteins.has(d.protein)) ??
      fresh[0] ??
      fallback.find((d) => !usedProteins.has(d.protein)) ??
      fallback[0];

    if (!choice) continue;

    result[i] = choice.id;
    usedProteins.add(choice.protein);
    usedIds.add(choice.id);

    const removeFrom = (list: Dinner[]) => {
      const idx = list.findIndex((d) => d.id === choice.id);
      if (idx >= 0) list.splice(idx, 1);
    };
    removeFrom(fresh);
    removeFrom(fallback);
  }

  return result;
}

export function pickLunch(
  options: LunchOption[],
  avoidIds: Set<string>,
  locked: string | null
): string {
  if (locked) return locked;
  if (options.length === 0) {
    throw new Error("No lunch options available to pick from");
  }
  const fresh = options.filter((o) => !avoidIds.has(o.id));
  const pool = fresh.length > 0 ? fresh : options;
  return pool[Math.floor(Math.random() * pool.length)].id;
}
