import "server-only";

import path from "path";
import type { RecipeImport } from "@/lib/imports/types";
import { AtomicJsonStore } from "./atomicJsonStore";

const store = new AtomicJsonStore(path.join(process.cwd(), "data"));
const FILE = "imports.json";

type ImportFile = { imports: RecipeImport[] };

async function readAll(): Promise<ImportFile> {
  try {
    return await store.readJson<ImportFile>(FILE);
  } catch {
    return { imports: [] };
  }
}

export async function listImports(): Promise<RecipeImport[]> {
  return (await readAll()).imports;
}

export async function getImport(id: string): Promise<RecipeImport | null> {
  return (await readAll()).imports.find((item) => item.id === id) ?? null;
}

export async function saveImport(item: RecipeImport): Promise<RecipeImport> {
  const file = await readAll();
  const index = file.imports.findIndex((entry) => entry.id === item.id);
  if (index >= 0) file.imports[index] = item;
  else file.imports.unshift(item);
  await store.writeJson(FILE, file);
  return item;
}
