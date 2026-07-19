"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogRecipe, MealKind } from "@/lib/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<CatalogRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MealKind | "archived" | "favorites">("all");
  const [pendingArchive, setPendingArchive] = useState<CatalogRecipe | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/recipes");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load recipes");
        if (!cancelled) setRecipes(json.recipes as CatalogRecipe[]);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load recipes");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    return recipes.filter((recipe) => {
      if (filter === "favorites") return recipe.favorite && recipe.status !== "archived";
      if (filter === "archived") return recipe.status === "archived";
      if (filter === "all") return recipe.status !== "archived";
      return recipe.kind === filter && recipe.status !== "archived";
    });
  }, [recipes, filter]);

  async function toggleFavorite(recipe: CatalogRecipe) {
    setError(null);
    const res = await fetch(`/api/recipes/${recipe.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...recipe, favorite: !recipe.favorite }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to update favorite");
      return;
    }
    setRecipes((prev) =>
      prev.map((item) => (item.id === recipe.id ? (json.recipe as CatalogRecipe) : item))
    );
  }

  async function archive(recipe: CatalogRecipe) {
    setError(null);
    setStatus(null);
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to archive recipe");
      return;
    }
    setRecipes((prev) =>
      prev.map((item) => (item.id === recipe.id ? (json.recipe as CatalogRecipe) : item))
    );
    setPendingArchive(null);
    setStatus(`Archived “${recipe.name}”.`);
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipes</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Add, edit, favorite, and archive household recipes.
          </p>
        </div>
        <Link
          href="/recipes/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-foreground px-4 text-sm font-medium text-background"
        >
          Add recipe
        </Link>
      </div>

      {pendingArchive && (
        <div
          className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
          role="alertdialog"
          aria-labelledby="archive-title"
        >
          <h2 id="archive-title" className="text-base font-semibold">
            Archive {pendingArchive.name}?
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            It leaves the active catalog but stays recoverable under Archived.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => archive(pendingArchive)}
              className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
            >
              Archive recipe
            </button>
            <button
              type="button"
              onClick={() => setPendingArchive(null)}
              className="min-h-11 rounded-lg border border-zinc-200 px-4 text-sm font-medium dark:border-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "Active"],
            ["dinner", "Dinners"],
            ["girl_lunch", "Girl lunches"],
            ["boy_lunch", "Boy lunches"],
            ["favorites", "Favorites"],
            ["archived", "Archived"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium ${
              filter === value
                ? "bg-foreground text-background"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400" aria-live="polite">
          {status}
        </p>
      )}

      <ul className="space-y-3">
        {visible.map((recipe) => (
          <li
            key={recipe.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">
                  {recipe.kind.replace("_", " ")}
                  {recipe.status === "archived" ? " · archived" : ""}
                  {recipe.favorite ? " · favorite" : ""}
                </p>
                <h2 className="text-lg font-semibold">{recipe.name}</h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {recipe.kind === "dinner"
                    ? `${recipe.cookMinutes ?? "?"} min · ${recipe.protein ?? "protein n/a"}`
                    : `${recipe.ingredients.length} ingredients`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(recipe)}
                  className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-700"
                >
                  {recipe.favorite ? "Unfavorite" : "Favorite"}
                </button>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-700"
                >
                  Edit
                </Link>
                {recipe.status !== "archived" && (
                  <button
                    type="button"
                    onClick={() => setPendingArchive(recipe)}
                    className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-700"
                  >
                    Archive
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          No recipes here yet.{" "}
          <Link href="/recipes/new" className="font-medium underline-offset-2 hover:underline">
            Add a recipe
          </Link>{" "}
          or import from TikTok under More.
        </p>
      )}
    </main>
  );
}
