-- Whole-JSON document store for meal-prep repositories.
-- One row per former data/*.json file.

CREATE TABLE IF NOT EXISTS documents (
  name TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
