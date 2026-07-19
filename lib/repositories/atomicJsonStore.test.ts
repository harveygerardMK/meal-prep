import { mkdtemp, readFile, rm } from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AtomicJsonStore } from "./atomicJsonStore";

type Doc = { value: number; schemaVersion: number };

describe("AtomicJsonStore", () => {
  let dir: string;
  let store: AtomicJsonStore;

  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), "meal-prep-store-"));
    store = new AtomicJsonStore(dir);
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("writes JSON atomically and reads it back", async () => {
    await store.writeJson<Doc>("sample.json", { value: 3, schemaVersion: 1 });
    const data = await store.readJson<Doc>("sample.json");
    expect(data).toEqual({ value: 3, schemaVersion: 1 });

    const raw = await readFile(path.join(dir, "sample.json"), "utf-8");
    expect(raw.endsWith("\n")).toBe(true);
  });

  it("serializes concurrent updates so the final write wins cleanly", async () => {
    await store.writeJson<Doc>("counter.json", { value: 0, schemaVersion: 1 });

    await Promise.all(
      Array.from({ length: 20 }, async (_, i) => {
        await store.updateJson<Doc>("counter.json", (current) => ({
          ...current,
          value: current.value + 1 + i * 0,
        }));
      })
    );

    const final = await store.readJson<Doc>("counter.json");
    expect(final.value).toBe(20);
  });
});
