import "server-only";

import path from "path";
import type { RecipeData } from "@/lib/types";
import { AtomicJsonStore } from "./atomicJsonStore";

const store = new AtomicJsonStore(path.join(process.cwd(), "data"));

export async function getRecipes(): Promise<RecipeData> {
  return store.readJson<RecipeData>("recipes.json");
}
