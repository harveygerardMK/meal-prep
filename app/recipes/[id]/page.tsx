"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

  if (error && !recipe) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center text-red-600" role="alert">
        {error}
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center text-zinc-500">
        Loading recipe…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Edit recipe</h1>
        <Link
          href="/recipes"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800"
        >
          Back
        </Link>
      </div>
      {status && (
        <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400" aria-live="polite">
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
    </main>
  );
}
