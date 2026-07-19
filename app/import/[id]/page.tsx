"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { RecipeImport } from "@/lib/imports/types";
import {
  Button,
  fieldClassName,
  labelClassName
} from "../../components/brand";

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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
        {error && !item ? (
          <p className="text-center text-accent" role="alert">
            {error}
          </p>
        ) : !item ? (
          <p className="text-center text-muted">Loading import…</p>
        ) : (
          <>
            <div className="mb-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
                Review
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight">
                Review import
              </h1>
              <p className="mt-2 text-sm text-muted">
                Status: {item.status} · confidence{" "}
                {(item.draft.confidence * 100).toFixed(0)}%
              </p>
            </div>

            {item.error && <p className="mb-4 text-sm text-accent">{item.error}</p>}
            <a
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mb-6 inline-block text-sm font-semibold text-accent underline-offset-2 hover:underline"
            >
              Open original TikTok
            </a>

            <form onSubmit={saveDraft} className="space-y-5">
              <div>
                <label htmlFor="name" className={labelClassName}>
                  Name
                </label>
                <input
                  id="name"
                  value={item.draft.name}
                  onChange={(e) =>
                    setItem({ ...item, draft: { ...item.draft, name: e.target.value } })
                  }
                  className={fieldClassName}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="protein" className={labelClassName}>
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
                    value={item.draft.cookMinutes ?? 30}
                    onChange={(e) =>
                      setItem({
                        ...item,
                        draft: { ...item.draft, cookMinutes: Number(e.target.value) },
                      })
                    }
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
                    className={fieldClassName}
                  />
                </div>
                <div>
                  <label htmlFor="instructions" className={labelClassName}>
                    Instructions (one per line)
                  </label>
                  <textarea
                    id="instructions"
                    rows={8}
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
                    className={fieldClassName}
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-accent" role="alert">
                  {error}
                </p>
              )}
              {status && (
                <p className="text-sm text-success" aria-live="polite">
                  {status}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="secondary" disabled={busy}>
                  Save draft
                </Button>
                <Button
                  type="button"
                  disabled={busy || item.status === "queued"}
                  onClick={approve}
                >
                  Approve for next week
                </Button>
              </div>
            </form>
          </>
        )}
      </main>
  );
}
