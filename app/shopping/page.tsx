"use client";

import { useEffect, useState } from "react";
import type { ShoppingHandoff } from "@/lib/shopping/handoff";
import type { GrocerySection } from "@/lib/groceryList";
import { GroceryListView } from "../components/GroceryListView";
import { MiscGroceryAdd } from "../components/MiscGroceryAdd";

type ShoppingResponse = {
  weekOf: string;
  groceryList: GrocerySection[];
  handoff: ShoppingHandoff;
  instacartLandingUrl: string | null;
};

export default function ShoppingPage() {
  const [data, setData] = useState<ShoppingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/shopping")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load shopping list");
        if (!cancelled) setData(json as ShoppingResponse);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load shopping list");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    setError(null);
    const res = await fetch("/api/shopping");
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Failed to refresh shopping list");
    setData(json as ShoppingResponse);
  }

  async function copyExport() {
    if (!data) return;
    await navigator.clipboard.writeText(data.handoff.exportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-red-600" role="alert">
        {error}
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-zinc-500">
        Building shopping list…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wrap-balance">Shopping list</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Week of {data.weekOf}
          </p>
        </div>
        <button
          type="button"
          onClick={copyExport}
          className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background"
        >
          {copied ? "Copied" : "Copy list"}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-300">
        Check off as you shop. Add extras any day this week. Each item also has Instacart and Google
        search links if you want delivery help.
      </p>

      {data.instacartLandingUrl && (
        <a
          href={data.instacartLandingUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-6 inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-4 text-sm font-medium dark:border-zinc-700"
        >
          Open Instacart cart page
        </a>
      )}

      <section className="mb-10 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold">Extras this week</h2>
        <MiscGroceryAdd
          onUpdated={() => {
            refresh().catch((err) =>
              setError(err instanceof Error ? err.message : "Failed to refresh list")
            );
          }}
        />
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold">Check off</h2>
        <GroceryListView
          key={data.weekOf}
          sections={data.groceryList}
          weekOf={data.weekOf}
          onMiscRemoved={() => {
            refresh().catch(() => undefined);
          }}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Search links</h2>
        <ul className="space-y-3">
          {data.handoff.items.map((item) => (
            <li
              key={`${item.section}-${item.name}-${item.details}`}
              className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.section}</p>
                  <h3 className="font-semibold capitalize">{item.name}</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">{item.details}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <a
                    href={item.instacartSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-700"
                  >
                    Instacart
                  </a>
                  <a
                    href={item.googleSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium dark:border-zinc-700"
                  >
                    Google
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
