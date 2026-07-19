"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RecipeImport } from "@/lib/imports/types";

export default function ImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imports, setImports] = useState<RecipeImport[]>([]);

  useEffect(() => {
    fetch("/api/imports")
      .then((res) => res.json())
      .then((json) => {
        if (json.imports) setImports(json.imports as RecipeImport[]);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/imports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, notes, kind: "dinner" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      router.push(`/import/${json.import.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Import from TikTok</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Paste a link, then add the caption/notes if needed. You always review before it joins next week.
          </p>
        </div>
        <Link
          href="/recipes"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800"
        >
          Catalog
        </Link>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="tiktok-url" className="mb-1 block text-sm font-medium">
            TikTok URL
          </label>
          <input
            id="tiktok-url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tiktok.com/..."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label htmlFor="notes" className="mb-1 block text-sm font-medium">
            Caption / notes (recommended fallback)
          </label>
          <textarea
            id="notes"
            rows={6}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Paste the caption, ingredients, or steps from the video."
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? "Analyzing…" : "Create draft"}
        </button>
      </form>

      {imports.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Recent imports</h2>
          <ul className="space-y-2">
            {imports.slice(0, 8).map((item) => (
              <li key={item.id}>
                <Link
                  href={`/import/${item.id}`}
                  className="text-sm font-medium underline-offset-2 hover:underline"
                >
                  {item.draft.name} · {item.status}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
