import "server-only";

import type { RecipeImport } from "@/lib/imports/types";
import { getDocumentStore } from "./getDocumentStore";

const FILE = "imports.json";

type ImportFile = { imports: RecipeImport[] };

async function readAll(): Promise<ImportFile> {
  try {
    const store = await getDocumentStore();
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
  const store = await getDocumentStore();
  const file = await readAll();
  const index = file.imports.findIndex((entry) => entry.id === item.id);
  if (index >= 0) file.imports[index] = item;
  else file.imports.unshift(item);
  await store.writeJson(FILE, file);
  return item;
}
