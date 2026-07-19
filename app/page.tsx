"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DinnerCard } from "./components/DinnerCard";
import { LunchCard } from "./components/LunchCard";
import { GroceryListView } from "./components/GroceryListView";
import type { ResolvedWeekPlan, Locks } from "@/lib/types";
import type { GrocerySection } from "@/lib/groceryList";

type PlanResponse = { plan: ResolvedWeekPlan; groceryList: GrocerySection[] };

export default function Home() {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [lockedDinners, setLockedDinners] = useState<boolean[]>([]);
  const [lockedGirl, setLockedGirl] = useState(false);
  const [lockedBoy, setLockedBoy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const res = await fetch("/api/plan");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load this week's plan");
        }
        if (cancelled) return;
        setData(json as PlanResponse);
        setLockedDinners(json.plan.locks.dinners.map((id: string | null) => id !== null));
        setLockedGirl(json.plan.locks.girlLunch !== null);
        setLockedBoy(json.plan.locks.boyLunch !== null);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load this week's plan");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function regenerate() {
    if (!data) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      const locks: Locks = {
        dinners: data.plan.dinners.map((d, i) => (lockedDinners[i] ? d.id : null)),
        girlLunch: lockedGirl ? data.plan.girlLunch.id : null,
        boyLunch: lockedBoy ? data.plan.boyLunch.id : null,
      };
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locks }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to regenerate plan");
      }
      setData(json as PlanResponse);
      setLockedDinners(json.plan.locks.dinners.map((id: string | null) => id !== null));
      setLockedGirl(json.plan.locks.girlLunch !== null);
      setLockedBoy(json.plan.locks.boyLunch !== null);
      setStatus("Plan updated — unlocked meals were reshuffled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate plan");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center text-zinc-500">
        Loading this week&apos;s plan…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">This Week&apos;s Plan</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Week of {data.plan.weekOf}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/settings"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            Settings
          </Link>
          <button
            type="button"
            onClick={regenerate}
            disabled={busy}
            aria-busy={busy}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? "Shuffling…" : "Regenerate"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="mb-4 text-sm text-emerald-700 dark:text-emerald-400" aria-live="polite">
          {status}
        </p>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Dinners</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.plan.dinners.map((dinner, i) => (
            <DinnerCard
              key={`${dinner.id}-${i}`}
              dinner={dinner}
              locked={lockedDinners[i] ?? false}
              onToggleLock={() =>
                setLockedDinners((prev) => {
                  const next = [...prev];
                  next[i] = !next[i];
                  return next;
                })
              }
            />
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Lunches</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <LunchCard
            label="Girl lunch"
            lunch={data.plan.girlLunch}
            locked={lockedGirl}
            onToggleLock={() => setLockedGirl((v) => !v)}
          />
          <LunchCard
            label="Boy lunch"
            lunch={data.plan.boyLunch}
            locked={lockedBoy}
            onToggleLock={() => setLockedBoy((v) => !v)}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Grocery List</h2>
        <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
          Checkoffs stay on this device for the current week.
        </p>
        <GroceryListView
          key={data.plan.weekOf}
          sections={data.groceryList}
          weekOf={data.plan.weekOf}
        />
      </section>
    </main>
  );
}
