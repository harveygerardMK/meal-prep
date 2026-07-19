"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RecipeImport } from "@/lib/imports/types";

export default function ImportReviewPage() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<RecipeImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/imports/${params.id}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load import");
        setItem(json.import as RecipeImport);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load import"));
  }, [params.id]);

  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/imports/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: item.draft }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save draft");
      setItem(json.import as RecipeImport);
      setStatus("Draft saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!item) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/imports/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to approve import");
      setItem(json.import as RecipeImport);
      setStatus("Approved and queued for next week.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve import");
    } finally {
      setBusy(false);
    }
  }

  if (error && !item) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center text-red-600" role="alert">
        {error}
      </main>
    );
  }

  if (!item) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center text-zinc-500">
        Loading import…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Review import</h1>
        <Link
          href="/import"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800"
        >
          Back
        </Link>
      </div>

      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        Status: {item.status} · confidence {(item.draft.confidence * 100).toFixed(0)}%
      </p>
      {item.error && (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">{item.error}</p>
      )}
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mb-6 inline-block text-sm underline"
      >
        Open original TikTok
      </a>

      <form onSubmit={saveDraft} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            value={item.draft.name}
            onChange={(e) =>
              setItem({ ...item, draft: { ...item.draft, name: e.target.value } })
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="protein" className="mb-1 block text-sm font-medium">
              Protein
            </label>
            <input
              id="protein"
              value={item.draft.protein ?? ""}
              onChange={(e) =>
                setItem({
                  ...item,
                  draft: { ...item.draft, protein: e.target.value },
                })
              }
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
              value={item.draft.cookMinutes ?? 30}
              onChange={(e) =>
                setItem({
                  ...item,
                  draft: { ...item.draft, cookMinutes: Number(e.target.value) },
                })
              }
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
            value={item.draft.ingredients.join("\n")}
            onChange={(e) =>
              setItem({
                ...item,
                draft: {
                  ...item.draft,
                  ingredients: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                },
              })
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="instructions" className="mb-1 block text-sm font-medium">
            Instructions (one per line)
          </label>
          <textarea
            id="instructions"
            rows={5}
            value={item.draft.instructions.join("\n")}
            onChange={(e) =>
              setItem({
                ...item,
                draft: {
                  ...item.draft,
                  instructions: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                },
              })
            }
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {status && (
          <p className="text-sm text-emerald-700 dark:text-emerald-400" aria-live="polite">
            {status}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={busy || item.status === "queued"}
            onClick={approve}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            Approve for next week
          </button>
        </div>
      </form>
    </main>
  );
}
