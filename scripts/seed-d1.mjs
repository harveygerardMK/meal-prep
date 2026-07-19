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

const ALL_FILES = [
  "recipes.json",
  "settings.json",
  "history.json",
  "imports.json",
  "plan-queue.json",
  "staples.json",
  "wildcard-state.json",
];

/** Skip history (and optionally queue/imports) so remote seed does not wipe live weeks. */
const skipHistory = process.argv.includes("--skip-history");
const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const onlyFiles = onlyArg
  ? onlyArg
      .slice("--only=".length)
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  : null;

const FILES = (onlyFiles ?? ALL_FILES).filter((file) => {
  if (skipHistory && (file === "history.json" || file === "imports.json" || file === "plan-queue.json")) {
    return false;
  }
  return true;
});

if (FILES.length === 0) {
  console.error("No documents selected to seed.");
  process.exit(1);
}

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
    } else if (file === "wildcard-state.json") {
      raw = JSON.stringify({ lastWildcardMonth: null }, null, 2) + "\n";
    } else if (file === "staples.json") {
      raw =
        JSON.stringify(
          {
            items: [
              { id: "milk", name: "Milk", section: "Dairy & Eggs" },
              { id: "eggs", name: "Eggs", section: "Dairy & Eggs" },
              { id: "sandwich-bread", name: "Sandwich bread", section: "Bakery & Bread" },
              { id: "butter", name: "Butter", section: "Dairy & Eggs" },
              { id: "bananas", name: "Bananas", section: "Produce" },
            ],
          },
          null,
          2
        ) + "\n";
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

console.log(
  `Seeding meal-prep-db (${mode.replace("--", "")}): ${FILES.join(", ")}${
    skipHistory ? " (skipping history/imports/queue)" : ""
  } …`
);
const result = spawnSync(
  "npx",
  ["wrangler", "d1", "execute", "meal-prep-db", mode, "--file", sqlPath],
  { cwd: root, stdio: "inherit", shell: process.platform === "win32" }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Seed complete.");
