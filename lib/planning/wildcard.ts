import type { CatalogRecipe } from "../types";

export type WildcardState = {
  lastWildcardMonth: string | null;
};

type WildcardPlanInput = {
  month: string;
  state: WildcardState;
  candidates: CatalogRecipe[];
  /** The first slot still open after intentional queue picks. */
  slotIndex: number | null;
  random?: () => number;
};

type WildcardPlan = {
  recipeId?: string;
  slotIndex?: number;
  nextState: WildcardState;
};

/**
 * Chooses an active, untried dinner only once per calendar month. The caller
 * supplies the slot remaining after queue priority, so wildcard never displaces
 * an intentional queued dinner.
 */
export function planMonthlyWildcard({
  month,
  state,
  candidates,
  slotIndex,
  random = Math.random,
}: WildcardPlanInput): WildcardPlan {
  if (state.lastWildcardMonth === month) {
    return { nextState: state };
  }

  const eligible = candidates.filter(
    (recipe) =>
      recipe.kind === "dinner" &&
      recipe.status === "active" &&
      recipe.wildcard === true
  );
  const nextState = { lastWildcardMonth: month };

  if (eligible.length === 0 || slotIndex === null) {
    return { nextState };
  }

  const recipe = eligible[Math.floor(random() * eligible.length)];
  return { recipeId: recipe.id, slotIndex, nextState };
}
