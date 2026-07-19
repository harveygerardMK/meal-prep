import "server-only";

// Repositories prefer Cloudflare D1 when MEALS_DB is bound; otherwise they
// fall back to AtomicJsonStore under data/ (local next start + vitest).
export {
  getRecipes,
  listCatalogRecipes,
  getCatalogRecipe,
  saveCatalogRecipe,
  archiveCatalogRecipe,
  isRecipeReferencedInHistory,
} from "./repositories/recipeRepository";
export { getSettings, saveSettings } from "./repositories/settingsRepository";
export {
  getHistory,
  saveHistory,
  upsertWeekPlan,
  getWeekPlan,
} from "./repositories/planRepository";
