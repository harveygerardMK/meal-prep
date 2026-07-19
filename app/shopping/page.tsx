"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ShoppingHandoff } from "@/lib/shopping/handoff";

type ShoppingResponse = {
  weekOf: string;
  handoff: ShoppingHandoff;
  instacartLandingUrl: string | null;
};

export default function ShoppingPage() {
  const [data, setData] = useState<ShoppingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/shopping")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load shopping list");
        setData(json as ShoppingResponse);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load shopping list")
      );
  }, []);

  async function copyExport() {
    if (!data) return;
    await navigator.clipboard.writeText(data.handoff.exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-red-600" role="alert">
        {error}
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-zinc-500">
        Building shopping handoff…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Shopping handoff</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Week of {data.weekOf} · mode {data.handoff.mode}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-800"
          >
            Plan
          </Link>
          <button
            type="button"
            onClick={copyExport}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            {copied ? "Copied" : "Copy list"}
          </button>
        </div>
      </div>

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-300">{data.handoff.note}</p>

      {data.instacartLandingUrl && (
        <a
          href={data.instacartLandingUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-6 inline-block rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white"
        >
          Open Instacart cart page
        </a>
      )}

      <ul className="space-y-3">
        {data.handoff.items.map((item) => (
          <li
            key={`${item.section}-${item.name}`}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-zinc-400">{item.section}</p>
                <h2 className="font-semibold">{item.name}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.details}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={item.instacartSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700"
                >
                  Instacart
                </a>
                <a
                  href={item.googleSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium dark:border-zinc-700"
                >
                  Google
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
