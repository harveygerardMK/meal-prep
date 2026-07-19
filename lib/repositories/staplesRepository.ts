import "server-only";

import type { StaplesData } from "@/lib/types";
import { getDocumentStore } from "./getDocumentStore";

const FILE = "staples.json";

/** Defaults used when the document has never been seeded (old D1 / fresh install). */
export const DEFAULT_STAPLES: StaplesData = {
  items: [
    { id: "milk", name: "Milk", section: "Dairy & Eggs" },
    { id: "eggs", name: "Eggs", section: "Dairy & Eggs" },
    { id: "sandwich-bread", name: "Sandwich bread", section: "Bakery & Bread" },
    { id: "butter", name: "Butter", section: "Dairy & Eggs" },
    { id: "bananas", name: "Bananas", section: "Produce" },
  ],
};

export async function getStaples(): Promise<StaplesData> {
  try {
    const store = await getDocumentStore();
    const data = await store.readJson<Partial<StaplesData>>(FILE);
    if (!Array.isArray(data.items)) {
      return DEFAULT_STAPLES;
    }
    return { items: data.items };
  } catch {
    return DEFAULT_STAPLES;
  }
}

export async function saveStaples(staples: StaplesData): Promise<void> {
  const store = await getDocumentStore();
  await store.writeJson(FILE, staples);
}
