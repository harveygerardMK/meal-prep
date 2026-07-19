import "server-only";

import type { Settings } from "@/lib/types";
import { getDocumentStore } from "./getDocumentStore";

function withDefaults(settings: Partial<Settings>): Settings {
  return {
    dinnersPerWeek: settings.dinnersPerWeek ?? 4,
    maxCookMinutes: settings.maxCookMinutes ?? 40,
    noRepeatWeeks: settings.noRepeatWeeks ?? 3,
    servings: settings.servings ?? 4,
    cookEffortTarget: settings.cookEffortTarget ?? 3,
    noveltyTarget: settings.noveltyTarget ?? 3,
    includeStaplesInGroceryList: settings.includeStaplesInGroceryList ?? true,
  };
}

export async function getSettings(): Promise<Settings> {
  const store = await getDocumentStore();
  const settings = await store.readJson<Partial<Settings>>("settings.json");
  return withDefaults(settings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  const store = await getDocumentStore();
  await store.writeJson("settings.json", withDefaults(settings));
}
