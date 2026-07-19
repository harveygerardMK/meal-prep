import "server-only";

import type { PlanQueueItem } from "@/lib/imports/types";
import { getDocumentStore } from "./getDocumentStore";

const FILE = "plan-queue.json";

type QueueFile = { items: PlanQueueItem[] };

async function readAll(): Promise<QueueFile> {
  try {
    const store = await getDocumentStore();
    return await store.readJson<QueueFile>(FILE);
  } catch {
    return { items: [] };
  }
}

export async function listQueue(): Promise<PlanQueueItem[]> {
  return (await readAll()).items;
}

export async function listPendingForWeek(weekOf: string): Promise<PlanQueueItem[]> {
  return (await readAll()).items.filter(
    (item) => item.weekOf === weekOf && item.status === "pending"
  );
}

export async function addQueueItem(item: PlanQueueItem): Promise<PlanQueueItem> {
  const store = await getDocumentStore();
  const file = await readAll();
  file.items.unshift(item);
  await store.writeJson(FILE, file);
  return item;
}

export async function markQueueConsumed(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const store = await getDocumentStore();
  const idSet = new Set(ids);
  const file = await readAll();
  file.items = file.items.map((item) =>
    idSet.has(item.id) ? { ...item, status: "consumed" as const } : item
  );
  await store.writeJson(FILE, file);
}
