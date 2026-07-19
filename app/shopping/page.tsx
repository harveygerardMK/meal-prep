"use client";

import { useEffect, useState } from "react";
import type { ShoppingHandoff } from "@/lib/shopping/handoff";
import type { GrocerySection } from "@/lib/groceryList";
import { GroceryListView } from "../components/GroceryListView";
import { MiscGroceryAdd } from "../components/MiscGroceryAdd";
import { Button, SectionHeading } from "../components/brand";

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
      <main className="mx-auto max-w-6xl px-6 py-16 text-center text-accent" role="alert">
        {error}
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
        Building shopping list…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
            Shopping
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight">
            Shopping list
          </h1>
          <p className="mt-2 text-sm text-muted">Week of {data.weekOf}</p>
        </div>
        <Button type="button" onClick={copyExport}>
          {copied ? "Copied" : "Copy list"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-accent" role="alert">
          {error}
        </p>
      )}

      <p className="mb-8 text-sm text-muted">
        Check off as you shop. Add extras any day this week. Each item also has Instacart and Google
        search links if you want delivery help.
      </p>

      {data.instacartLandingUrl && (
        <a
          href={data.instacartLandingUrl}
          target="_blank"
          rel="noreferrer"
          className="mb-8 inline-flex items-center justify-center rounded bg-success px-[18px] py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          Open Instacart cart page
        </a>
      )}

      <section className="mb-12 border-t border-border pt-6">
        <SectionHeading>Extras this week</SectionHeading>
        <MiscGroceryAdd
          onUpdated={() => {
            refresh().catch((err) =>
              setError(err instanceof Error ? err.message : "Failed to refresh list")
            );
          }}
        />
      </section>

      <section className="mb-12">
        <SectionHeading>Check off</SectionHeading>
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
        <SectionHeading>Search links</SectionHeading>
        <ul className="divide-y divide-border border-t border-border">
          {data.handoff.items.map((item) => (
            <li
              key={`${item.section}-${item.name}-${item.details}`}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-meta">
                  {item.section}
                </p>
                <h3 className="font-serif text-xl font-semibold capitalize">{item.name}</h3>
                <p className="mt-1 text-sm text-meta">{item.details}</p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <a
                  href={item.instacartSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
                >
                  Instacart
                </a>
                <a
                  href={item.googleSearchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-accent underline-offset-2 hover:underline"
                >
                  Google
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
