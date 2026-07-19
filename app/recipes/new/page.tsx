"use client";

import { useRouter } from "next/navigation";
import { RecipeForm } from "@/app/components/RecipeForm";
import { AppHeader, LinkButton, SiteNav } from "../../components/brand";

export default function NewRecipePage() {
  const router = useRouter();

  return (
    <>
      <AppHeader
        nav={<SiteNav active="recipes" />}
        actions={
          <LinkButton href="/recipes" variant="secondary">
            Back
          </LinkButton>
        }
      />
      <main className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
            Catalog
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">Add recipe</h1>
        </div>
        <RecipeForm
          onSaved={(recipe) => {
            router.replace(`/recipes/${recipe.id}`);
          }}
        />
      </main>
    </>
  );
}
