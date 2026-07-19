"use client";

import { useEffect, useState } from "react";
import type { ShoppingHandoff } from "@/lib/shopping/handoff";
import {
  AppHeader,
  Button,
  LinkButton,
  SiteNav,
} from "../components/brand";

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

  return (
    <>
      <AppHeader
        nav={<SiteNav active="shopping" />}
        actions={
          data ? (
            <Button type="button" onClick={copyExport}>
              {copied ? "Copied" : "Copy list"}
            </Button>
          ) : null
        }
      />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        {error ? (
          <p className="text-center text-accent" role="alert">
            {error}
          </p>
        ) : !data ? (
          <p className="text-center text-muted">Building shopping handoff…</p>
        ) : (
          <>
            <div className="mb-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
                Shopping
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight">
                Shopping handoff
              </h1>
              <p className="mt-2 text-sm text-muted">
                Week of {data.weekOf} · mode {data.handoff.mode}
              </p>
            </div>

            <p className="mb-6 text-sm text-muted">{data.handoff.note}</p>

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

            <ul className="divide-y divide-border border-t border-border">
              {data.handoff.items.map((item) => (
                <li
                  key={`${item.section}-${item.name}`}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-meta">
                      {item.section}
                    </p>
                    <h2 className="font-serif text-xl font-semibold">{item.name}</h2>
                    <p className="mt-1 text-sm text-meta">{item.details}</p>
                  </div>
                  <a
                    href={item.instacartSearchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 text-sm font-semibold text-accent underline-offset-2 hover:underline"
                  >
                    Instacart search
                  </a>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              <LinkButton href="/" variant="secondary">
                Back to plan
              </LinkButton>
            </div>
          </>
        )}
      </main>
    </>
  );
}
