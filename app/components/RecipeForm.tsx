"use client";

import { FormEvent, useState } from "react";
import type { CatalogRecipe, MealKind } from "@/lib/types";

type Props = {
  initial?: CatalogRecipe;
  onSaved: (recipe: CatalogRecipe) => void;
};

export function RecipeForm({ initial, onSaved }: Props) {
  const [form, setForm] = useState({
    id: initial?.id ?? "",
    kind: (initial?.kind ?? "dinner") as MealKind,
    name: initial?.name ?? "",
    protein: initial?.protein ?? "chicken",
    cookMinutes: initial?.cookMinutes ?? 30,
    tags: (initial?.tags ?? []).join(", "),
    ingredients: (initial?.ingredients ?? []).join("\n"),
    instructions: (initial?.instructions ?? []).join("\n"),
    status: initial?.status ?? "active",
    favorite: initial?.favorite ?? false,
    effortScore: initial?.effortScore ?? 3,
    noveltyScore: initial?.noveltyScore ?? 3,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      id: form.id || undefined,
      kind: form.kind,
      name: form.name,
      protein: form.protein,
      cookMinutes: Number(form.cookMinutes),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients: form.ingredients
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      instructions: form.instructions
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      status: form.status,
      favorite: form.favorite,
      effortScore: Number(form.effortScore),
      noveltyScore: Number(form.noveltyScore),
      source: initial?.source ?? { type: "manual" as const },
    };

    try {
      const res = await fetch(initial ? `/api/recipes/${initial.id}` : "/api/recipes", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save recipe");
      onSaved(json.recipe as CatalogRecipe);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="kind" className="mb-1 block text-sm font-medium">
          Kind
        </label>
        <select
          id="kind"
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value as MealKind })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <option value="dinner">Dinner</option>
          <option value="girl_lunch">Girl lunch</option>
          <option value="boy_lunch">Boy lunch</option>
        </select>
      </div>

      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      {form.kind === "dinner" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="protein" className="mb-1 block text-sm font-medium">
              Protein
            </label>
            <input
              id="protein"
              required
              value={form.protein}
              onChange={(e) => setForm({ ...form, protein: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="cookMinutes" className="mb-1 block text-sm font-medium">
              Cook minutes
            </label>
            <input
              id="cookMinutes"
              type="number"
              min={1}
              required
              value={form.cookMinutes}
              onChange={(e) => setForm({ ...form, cookMinutes: Number(e.target.value) })}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="effortScore" className="mb-1 block text-sm font-medium">
            Effort (1 easy – 5 hard)
          </label>
          <input
            id="effortScore"
            type="number"
            min={1}
            max={5}
            value={form.effortScore}
            onChange={(e) => setForm({ ...form, effortScore: Number(e.target.value) })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="noveltyScore" className="mb-1 block text-sm font-medium">
            Novelty (1 familiar – 5 new)
          </label>
          <input
            id="noveltyScore"
            type="number"
            min={1}
            max={5}
            value={form.noveltyScore}
            onChange={(e) => setForm({ ...form, noveltyScore: Number(e.target.value) })}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label htmlFor="ingredients" className="mb-1 block text-sm font-medium">
          Ingredients (one per line)
        </label>
        <textarea
          id="ingredients"
          rows={6}
          value={form.ingredients}
          onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="instructions" className="mb-1 block text-sm font-medium">
          Instructions (one step per line)
        </label>
        <textarea
          id="instructions"
          rows={5}
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="tags" className="mb-1 block text-sm font-medium">
          Tags (comma separated)
        </label>
        <input
          id="tags"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.favorite}
          onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
        />
        Favorite
      </label>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {busy ? "Saving…" : initial ? "Save changes" : "Save recipe"}
      </button>
    </form>
  );
}
