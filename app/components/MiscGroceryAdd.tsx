"use client";

import { FormEvent, useState } from "react";
import type { GrocerySection } from "@/lib/groceryList";
import type { MiscGroceryItem } from "@/lib/types";

type MiscResponse = {
  weekOf: string;
  miscGrocery: MiscGroceryItem[];
  groceryList: GrocerySection[];
};

export function MiscGroceryAdd({
  onUpdated,
}: {
  onUpdated: (payload: MiscResponse) => void;
}) {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/grocery/misc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, note: note || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not add item");
      onUpdated(json as MiscResponse);
      setName("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add item");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label htmlFor="misc-name" className="mb-1 block text-sm font-medium">
          Add something else
        </label>
        <input
          id="misc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="Paper towels, snacks, dog food…"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="misc-note" className="mb-1 block text-sm font-medium">
          Note <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <input
          id="misc-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Brand or size"
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || name.trim().length === 0}
        className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
      >
        {busy ? "Adding…" : "Add to list"}
      </button>
    </form>
  );
}
