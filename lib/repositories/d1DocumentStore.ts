import "server-only";

import type { DocumentStore } from "./documentStore";

type DocumentRow = { data: string };

/**
 * Whole-JSON document store backed by Cloudflare D1.
 * One row per logical file (recipes.json, settings.json, …).
 */
export class D1DocumentStore implements DocumentStore {
  constructor(private readonly db: D1Database) {}

  async readJson<T>(file: string): Promise<T> {
    const row = await this.db
      .prepare("SELECT data FROM documents WHERE name = ?")
      .bind(file)
      .first<DocumentRow>();

    if (!row) {
      throw new Error(`Document not found: ${file}`);
    }

    return JSON.parse(row.data) as T;
  }

  async writeJson<T>(file: string, data: T): Promise<void> {
    const payload = JSON.stringify(data, null, 2) + "\n";
    await this.db
      .prepare(
        `INSERT INTO documents (name, data, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(name) DO UPDATE SET
           data = excluded.data,
           updated_at = excluded.updated_at`
      )
      .bind(file, payload)
      .run();
  }

  async updateJson<T>(file: string, updater: (current: T) => T): Promise<T> {
    const current = await this.readJson<T>(file);
    const next = updater(current);
    await this.writeJson(file, next);
    return next;
  }
}
