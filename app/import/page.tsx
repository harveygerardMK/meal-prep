"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { RecipeImport } from "@/lib/imports/types";
import {
  Button,
  SectionHeading,
  fieldClassName,
  labelClassName
} from "../components/brand";

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
    <main className="mx-auto w-full max-w-xl px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
            Import
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Import from TikTok
          </h1>
          <p className="mt-2 text-sm text-muted">
            Paste a link, then add the caption/notes if needed. You always review before it joins
            next week.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="tiktok-url" className={labelClassName}>
              TikTok URL
            </label>
            <input
              id="tiktok-url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tiktok.com/..."
              className={fieldClassName}
            />
          </div>
          <div>
            <label htmlFor="notes" className={labelClassName}>
              Caption / notes (recommended fallback)
            </label>
            <textarea
              id="notes"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste the caption, ingredients, or steps from the video."
              className={fieldClassName}
            />
          </div>
          {error && (
            <p className="text-sm text-accent" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy}>
            {busy ? "Analyzing…" : "Create draft"}
          </Button>
        </form>

        {imports.length > 0 && (
          <section className="mt-12">
            <SectionHeading>Recent imports</SectionHeading>
            <ul className="divide-y divide-border border-t border-border">
              {imports.slice(0, 8).map((item) => (
                <li key={item.id} className="py-3">
                  <Link
                    href={`/import/${item.id}`}
                    className="font-serif text-lg font-semibold underline-offset-2 hover:underline"
                  >
                    {item.draft.name}
                  </Link>
                  <p className="text-[13px] text-meta">{item.status}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
  );
}
