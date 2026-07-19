import "server-only";

import path from "path";
import type { Settings } from "@/lib/types";
import { AtomicJsonStore } from "./atomicJsonStore";

const store = new AtomicJsonStore(path.join(process.cwd(), "data"));

export async function getSettings(): Promise<Settings> {
  return store.readJson<Settings>("settings.json");
}

export async function saveSettings(settings: Settings): Promise<void> {
  await store.writeJson("settings.json", settings);
}
