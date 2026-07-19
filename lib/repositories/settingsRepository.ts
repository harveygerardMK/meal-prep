import "server-only";

import path from "path";
import type { Settings } from "@/lib/types";
import { AtomicJsonStore } from "./atomicJsonStore";

const store = new AtomicJsonStore(path.join(process.cwd(), "data"));

function withDefaults(settings: Partial<Settings>): Settings {
  return {
    dinnersPerWeek: settings.dinnersPerWeek ?? 4,
    maxCookMinutes: settings.maxCookMinutes ?? 40,
    noRepeatWeeks: settings.noRepeatWeeks ?? 3,
    servings: settings.servings ?? 4,
    cookEffortTarget: settings.cookEffortTarget ?? 3,
    noveltyTarget: settings.noveltyTarget ?? 3,
  };
}

export async function getSettings(): Promise<Settings> {
  const settings = await store.readJson<Partial<Settings>>("settings.json");
  return withDefaults(settings);
}

export async function saveSettings(settings: Settings): Promise<void> {
  await store.writeJson("settings.json", withDefaults(settings));
}
