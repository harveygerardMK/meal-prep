import "server-only";

import type { CatalogData, CatalogRecipe, RecipeData } from "@/lib/types";
import {
  legacyRecipeDataToCatalog,
  recipeToPlannerViews,
} from "@/lib/recipes/recipeValidation";
import { getDocumentStore } from "./getDocumentStore";
import { getHistory } from "./planRepository";

type StoredRecipes = CatalogData | RecipeData;

function isCatalogData(data: StoredRecipes): data is CatalogData {
  return (
    typeof data === "object" &&
    data !== null &&
    "schemaVersion" in data &&
    (data as CatalogData).schemaVersion === 2 &&
    Array.isArray((data as CatalogData).recipes)
  );
}

async function readCatalog(): Promise<CatalogData> {
  const store = await getDocumentStore();
  const raw = await store.readJson<StoredRecipes>("recipes.json");
  if (isCatalogData(raw)) {
    return raw;
  }
  return {
    schemaVersion: 2,
    servings: raw.servings,
    recipes: legacyRecipeDataToCatalog(raw),
  };
}

async function writeCatalog(catalog: CatalogData): Promise<void> {
  const store = await getDocumentStore();
  await store.writeJson("recipes.json", catalog);
}

/** Planner-facing active recipes only. */
export async function getRecipes(): Promise<RecipeData> {
  const catalog = await readCatalog();
  return recipeToPlannerViews(catalog.recipes, catalog.servings);
}

export async function listCatalogRecipes(): Promise<CatalogRecipe[]> {
  const catalog = await readCatalog();
  return catalog.recipes;
}

export async function getCatalogRecipe(id: string): Promise<CatalogRecipe | null> {
  const catalog = await readCatalog();
  return catalog.recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function saveCatalogRecipe(recipe: CatalogRecipe): Promise<CatalogRecipe> {
  const catalog = await readCatalog();
  const index = catalog.recipes.findIndex((item) => item.id === recipe.id);
  if (index >= 0) {
    catalog.recipes[index] = recipe;
  } else {
    catalog.recipes.push(recipe);
  }
  await writeCatalog(catalog);
  return recipe;
}

export async function archiveCatalogRecipe(id: string): Promise<CatalogRecipe> {
  const catalog = await readCatalog();
  const index = catalog.recipes.findIndex((item) => item.id === id);
  if (index < 0) {
    throw new Error(`Unknown recipe id: ${id}`);
  }
  catalog.recipes[index] = { ...catalog.recipes[index], status: "archived" };
  await writeCatalog(catalog);
  return catalog.recipes[index];
}

export async function isRecipeReferencedInHistory(id: string): Promise<boolean> {
  const history = await getHistory();
  return history.weeks.some(
    (week) =>
      week.dinners.includes(id) ||
      week.girlLunch === id ||
      week.boyLunch === id
  );
}
