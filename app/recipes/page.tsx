"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { CatalogRecipe, MealKind } from "@/lib/types";
import {
  CardActionButton,
  LinkButton,
  RecipeCard,
  cn
} from "../components/brand";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<CatalogRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MealKind | "archived" | "favorites">("all");
  const [addState, setAddState] = useState<Record<string, "adding" | "added">>({});

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
      } finally {
        if (!cancelled) setLoading(false);
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
    if (
      !window.confirm(
        `Archive “${recipe.name}”? It leaves the active catalog but stays available for history.`
      )
    ) {
      return;
    }
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

  async function addToThisWeek(recipe: CatalogRecipe) {
    setError(null);
    setAddState((prev) => ({ ...prev, [recipe.id]: "adding" }));
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addRecipe", recipeId: recipe.id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to add to this week");
      setAddState((prev) => ({ ...prev, [recipe.id]: "added" }));
      window.setTimeout(() => {
        setAddState((prev) => {
          const { [recipe.id]: _done, ...rest } = prev;
          return rest;
        });
      }, 2500);
    } catch (err) {
      setAddState((prev) => {
        const { [recipe.id]: _failed, ...rest } = prev;
        return rest;
      });
      setError(err instanceof Error ? err.message : "Failed to add to this week");
    }
  }

  const kindLabel = (kind: MealKind) => kind.replace("_", " ");

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
              Catalog
            </p>
            <h1 className="font-serif text-4xl font-semibold tracking-tight">
              Recipes
            </h1>
            <p className="mt-2 text-sm text-muted">
              Add, edit, favorite, and archive household recipes.
            </p>
          </div>
          <LinkButton href="/recipes/new">Add recipe</LinkButton>
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
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
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
                filter === value
                  ? "bg-accent text-accent-foreground"
                  : "border border-border text-muted hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-accent" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading recipes…</p>
        ) : (
          <>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  name={recipe.name}
                  eyebrow={`${kindLabel(recipe.kind)}${
                    recipe.status === "archived" ? " · archived" : ""
                  }`}
                  meta={
                    recipe.kind === "dinner"
                      ? [
                          `${recipe.cookMinutes ?? "?"} min`,
                          recipe.protein,
                          ...recipe.tags.slice(0, 2),
                        ]
                      : [
                          `${recipe.ingredients.length} ingredients`,
                          ...recipe.tags.slice(0, 2),
                        ]
                  }
                  action={
                    <CardActionButton
                      active={recipe.favorite}
                      onClick={() => toggleFavorite(recipe)}
                      activeLabel="Favorited"
                      inactiveLabel="Favorite"
                    />
                  }
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {recipe.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => addToThisWeek(recipe)}
                        disabled={addState[recipe.id] === "adding"}
                        className={cn(
                          "rounded border px-2.5 py-1 text-xs font-semibold transition-colors duration-150",
                          addState[recipe.id] === "added"
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border text-foreground hover:border-accent hover:text-accent-text",
                          addState[recipe.id] === "adding" && "opacity-60"
                        )}
                      >
                        {addState[recipe.id] === "adding"
                          ? "Adding…"
                          : addState[recipe.id] === "added"
                            ? "On this week's menu"
                            : "Add to this week"}
                      </button>
                    )}
                    <Link
                      href={`/recipes/${recipe.id}`}
                      className="text-sm font-semibold text-foreground underline-offset-2 hover:underline"
                    >
                      Edit
                    </Link>
                    {recipe.status !== "archived" && (
                      <button
                        type="button"
                        onClick={() => archive(recipe)}
                        className="text-sm font-semibold text-muted hover:text-foreground"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </RecipeCard>
              ))}
            </div>

            {visible.length === 0 && (
              <p className="text-sm text-muted">
                {filter === "all"
                  ? "No active recipes yet. Add one to start building the household catalog."
                  : "No recipes in this filter."}
              </p>
            )}
          </>
        )}
      </main>
  );
}
