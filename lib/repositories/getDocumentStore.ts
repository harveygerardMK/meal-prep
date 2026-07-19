import "server-only";

import path from "path";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { AtomicJsonStore } from "./atomicJsonStore";
import { D1DocumentStore } from "./d1DocumentStore";
import type { DocumentStore } from "./documentStore";

let diskStore: AtomicJsonStore | null = null;

function getDiskStore(): AtomicJsonStore {
  if (!diskStore) {
    diskStore = new AtomicJsonStore(path.join(process.cwd(), "data"));
  }
  return diskStore;
}

/**
 * Prefer Cloudflare D1 when the Worker binding is available; otherwise fall
 * back to the local atomic JSON store (vitest / plain `next start`).
 */
export async function getDocumentStore(): Promise<DocumentStore> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env?.MEALS_DB) {
      return new D1DocumentStore(env.MEALS_DB);
    }
  } catch {
    // Outside the Cloudflare runtime (tests, plain Node).
  }

  return getDiskStore();
}
