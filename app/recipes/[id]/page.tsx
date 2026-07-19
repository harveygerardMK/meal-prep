"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { RecipeForm } from "@/app/components/RecipeForm";
import type { CatalogRecipe } from "@/lib/types";

export default function EditRecipePage() {
  const params = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<CatalogRecipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/recipes/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load recipe");
        if (!cancelled) setRecipe(json.recipe as CatalogRecipe);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load recipe");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {error && !recipe ? (
          <p className="text-center text-accent" role="alert">
            {error}
          </p>
        ) : !recipe ? (
          <p className="text-center text-muted">Loading recipe…</p>
        ) : (
          <>
            <div className="mb-10">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
                Catalog
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight">
                Edit recipe
              </h1>
              <p className="mt-2 font-serif text-xl text-muted">{recipe.name}</p>
            </div>
            {status && (
              <p className="mb-4 text-sm text-success" aria-live="polite">
                {status}
              </p>
            )}
            <RecipeForm
              initial={recipe}
              onSaved={(saved) => {
                setRecipe(saved);
                setStatus("Recipe saved.");
              }}
            />
          </>
        )}
      </main>
  );
}
