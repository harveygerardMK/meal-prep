"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RecipeForm } from "@/app/components/RecipeForm";

export default function NewRecipePage() {
  const router = useRouter();

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Add recipe</h1>
        <Link
          href="/recipes"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800"
        >
          Back
        </Link>
      </div>
      <RecipeForm
        onSaved={(recipe) => {
          router.replace(`/recipes/${recipe.id}`);
        }}
      />
    </main>
  );
}
