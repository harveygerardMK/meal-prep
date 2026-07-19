import "server-only";

import type { WildcardState } from "@/lib/planning/wildcard";
import { getDocumentStore } from "./getDocumentStore";

const FILE = "wildcard-state.json";
const DEFAULT_STATE: WildcardState = { lastWildcardMonth: null };

export async function getWildcardState(): Promise<WildcardState> {
  try {
    const store = await getDocumentStore();
    const state = await store.readJson<Partial<WildcardState>>(FILE);
    return {
      lastWildcardMonth:
        typeof state.lastWildcardMonth === "string" ? state.lastWildcardMonth : null,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export async function saveWildcardState(state: WildcardState): Promise<void> {
  const store = await getDocumentStore();
  await store.writeJson(FILE, state);
}
