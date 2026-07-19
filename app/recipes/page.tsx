"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogRecipe, MealKind } from "@/lib/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<CatalogRecipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MealKind | "archived" | "favorites">("all");

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
    const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Failed to archive recipe");
      return;
    }
    setRecipes((prev) =>
      prev.map((item) => (item.id === recipe.id ? (json.recipe as CatalogRecipe) : item))
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recipe catalog</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Add, edit, favorite, and archive household recipes.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Plan
          </Link>
          <Link
            href="/recipes/new"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Add recipe
          </Link>
        </div>
      </div>

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
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filter === value
                ? "bg-foreground text-background"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
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

      <ul className="space-y-3">
        {visible.map((recipe) => (
          <li
            key={recipe.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">
                  {recipe.kind.replace("_", " ")}
                  {recipe.status === "archived" ? " · archived" : ""}
                  {recipe.favorite ? " · favorite" : ""}
                </p>
                <h2 className="text-lg font-semibold">{recipe.name}</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {recipe.kind === "dinner"
                    ? `${recipe.cookMinutes ?? "?"} min · ${recipe.protein ?? "protein n/a"}`
                    : `${recipe.ingredients.length} ingredients`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleFavorite(recipe)}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700"
                >
                  {recipe.favorite ? "Unfavorite" : "Favorite"}
                </button>
                <Link
                  href={`/recipes/${recipe.id}`}
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700"
                >
                  Edit
                </Link>
                {recipe.status !== "archived" && (
                  <button
                    type="button"
                    onClick={() => archive(recipe)}
                    className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700"
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
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No recipes in this filter.</p>
      )}
    </main>
  );
}
