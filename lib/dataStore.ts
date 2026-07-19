import "server-only";

// Local JSON repositories with atomic writes. Swap these adapters for Postgres
// when DATABASE_URL is configured for hosted multi-device use.
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
