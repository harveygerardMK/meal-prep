import "server-only";

/**
 * Shared document-store contract used by meal-prep repositories.
 * Implementations: AtomicJsonStore (local disk) and D1DocumentStore (Cloudflare).
 */
export type DocumentStore = {
  readJson<T>(file: string): Promise<T>;
  writeJson<T>(file: string, data: T): Promise<void>;
  updateJson<T>(file: string, updater: (current: T) => T): Promise<T>;
};
