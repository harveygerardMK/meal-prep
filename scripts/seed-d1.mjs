#!/usr/bin/env node
/**
 * Seed Cloudflare D1 from local data/*.json files.
 *
 * Usage:
 *   node scripts/seed-d1.mjs --local
 *   node scripts/seed-d1.mjs --remote
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const mode = process.argv.includes("--remote") ? "--remote" : "--local";

const FILES = [
  "recipes.json",
  "settings.json",
  "history.json",
  "imports.json",
  "plan-queue.json",
];

function sqlEscape(value) {
  return value.replaceAll("'", "''");
}

const statements = [];
for (const file of FILES) {
  const filePath = path.join(root, "data", file);
  let raw;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    if (file === "imports.json") {
      raw = JSON.stringify({ imports: [] }, null, 2) + "\n";
    } else if (file === "plan-queue.json") {
      raw = JSON.stringify({ items: [] }, null, 2) + "\n";
    } else {
      throw error;
    }
  }

  // Validate JSON before inserting.
  JSON.parse(raw);
  if (!raw.endsWith("\n")) raw += "\n";

  statements.push(
    `INSERT INTO documents (name, data, updated_at) VALUES ('${file}', '${sqlEscape(raw)}', datetime('now')) ON CONFLICT(name) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at;`
  );
}

const sql = statements.join("\n") + "\n";
const dir = mkdtempSync(path.join(tmpdir(), "meal-prep-seed-"));
const sqlPath = path.join(dir, "seed.sql");
writeFileSync(sqlPath, sql, "utf8");

console.log(`Seeding meal-prep-db (${mode.replace("--", "")}) from data/*.json …`);
const result = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "meal-prep-db", mode, "--file", sqlPath],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Seed complete.");
