"use client";

import { FormEvent, useState } from "react";
import type { CatalogRecipe, MealKind } from "@/lib/types";
import { Button, fieldClassName, labelClassName } from "./brand";

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
    wildcard: initial?.wildcard ?? false,
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
      wildcard: form.wildcard,
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
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="kind" className={labelClassName}>
          Kind
        </label>
        <select
          id="kind"
          value={form.kind}
          onChange={(e) => setForm({ ...form, kind: e.target.value as MealKind })}
          className={fieldClassName}
        >
          <option value="dinner">Dinner</option>
          <option value="girl_lunch">Girl lunch</option>
          <option value="boy_lunch">Boy lunch</option>
        </select>
      </div>

      <div>
        <label htmlFor="name" className={labelClassName}>
          Name
        </label>
        <input
          id="name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={fieldClassName}
        />
      </div>

      {form.kind === "dinner" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="protein" className={labelClassName}>
                Protein
              </label>
              <input
                id="protein"
                required
                value={form.protein}
                onChange={(e) => setForm({ ...form, protein: e.target.value })}
                className={fieldClassName}
              />
            </div>
            <div>
              <label htmlFor="cookMinutes" className={labelClassName}>
                Cook minutes
              </label>
              <input
                id="cookMinutes"
                type="number"
                min={1}
                required
                value={form.cookMinutes}
                onChange={(e) => setForm({ ...form, cookMinutes: Number(e.target.value) })}
                className={fieldClassName}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.wildcard}
              onChange={(e) => setForm({ ...form, wildcard: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Wildcard / untried
          </label>
        </>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="effortScore" className={labelClassName}>
            Effort (1 easy – 5 hard)
          </label>
          <input
            id="effortScore"
            type="number"
            min={1}
            max={5}
            value={form.effortScore}
            onChange={(e) => setForm({ ...form, effortScore: Number(e.target.value) })}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="noveltyScore" className={labelClassName}>
            Novelty (1 familiar – 5 new)
          </label>
          <input
            id="noveltyScore"
            type="number"
            min={1}
            max={5}
            value={form.noveltyScore}
            onChange={(e) => setForm({ ...form, noveltyScore: Number(e.target.value) })}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label htmlFor="ingredients" className={labelClassName}>
            Ingredients (one per line)
          </label>
          <textarea
            id="ingredients"
            rows={8}
            value={form.ingredients}
            onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
            className={fieldClassName}
          />
        </div>
        <div>
          <label htmlFor="instructions" className={labelClassName}>
            Instructions (one step per line)
          </label>
          <textarea
            id="instructions"
            rows={8}
            value={form.instructions}
            onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            className={fieldClassName}
          />
        </div>
      </div>

      <div>
        <label htmlFor="tags" className={labelClassName}>
          Tags (comma separated)
        </label>
        <input
          id="tags"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          className={fieldClassName}
        />
      </div>

      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={form.favorite}
          onChange={(e) => setForm({ ...form, favorite: e.target.checked })}
          className="accent-[var(--accent)]"
        />
        Favorite
      </label>

      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" disabled={busy} aria-busy={busy}>
        {busy ? "Saving…" : initial ? "Save changes" : "Save recipe"}
      </Button>
    </form>
  );
}
