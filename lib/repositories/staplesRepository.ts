import "server-only";

import type { StaplesData } from "@/lib/types";
import { getDocumentStore } from "./getDocumentStore";

export async function getStaples(): Promise<StaplesData> {
  const store = await getDocumentStore();
  return store.readJson<StaplesData>("staples.json");
}

export async function saveStaples(staples: StaplesData): Promise<void> {
  const store = await getDocumentStore();
  await store.writeJson("staples.json", staples);
}
