import fs from "fs/promises";
import path from "path";
import type { RecipeData, Settings, History } from "./types";

// Writes to local disk only persist for `next dev`/self-hosted deploys, not on
// Vercel's serverless filesystem — swap to Vercel Blob/a DB before deploying there.
const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await fs.readFile(path.join(DATA_DIR, file), "utf-8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.writeFile(
    path.join(DATA_DIR, file),
    JSON.stringify(data, null, 2) + "\n",
    "utf-8"
  );
}

export const getRecipes = () => readJson<RecipeData>("recipes.json");
export const getSettings = () => readJson<Settings>("settings.json");
export const saveSettings = (settings: Settings) =>
  writeJson("settings.json", settings);
export const getHistory = () => readJson<History>("history.json");
export const saveHistory = (history: History) =>
  writeJson("history.json", history);
