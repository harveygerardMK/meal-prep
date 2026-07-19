"use client";

import { FormEvent, useState } from "react";
import type { GrocerySection } from "@/lib/groceryList";
import type { MiscGroceryItem } from "@/lib/types";
import { Button, fieldClassName, labelClassName } from "./brand";

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
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="misc-name" className={labelClassName}>
          Add something else
        </label>
        <input
          id="misc-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={80}
          placeholder="Paper towels, snacks, dog food…"
          className={fieldClassName}
        />
      </div>
      <div>
        <label htmlFor="misc-note" className={labelClassName}>
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="misc-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={120}
          placeholder="Brand or size"
          className={fieldClassName}
        />
      </div>
      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || name.trim().length === 0}>
        {busy ? "Adding…" : "Add to list"}
      </Button>
    </form>
  );
}
