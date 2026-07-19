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

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json())
      .then((res: PlanResponse) => {
        setData(res);
        setLockedDinners(res.plan.locks.dinners.map((id) => id !== null));
        setLockedGirl(res.plan.locks.girlLunch !== null);
        setLockedBoy(res.plan.locks.boyLunch !== null);
      });
  }, []);

  async function regenerate() {
    if (!data) return;
    setBusy(true);
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
    const json: PlanResponse = await res.json();
    setData(json);
    setLockedDinners(json.plan.locks.dinners.map((id) => id !== null));
    setLockedGirl(json.plan.locks.girlLunch !== null);
    setLockedBoy(json.plan.locks.boyLunch !== null);
    setBusy(false);
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
            onClick={regenerate}
            disabled={busy}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
          >
            {busy ? "Shuffling…" : "Regenerate"}
          </button>
        </div>
      </div>

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
        <GroceryListView sections={data.groceryList} />
      </section>
    </main>
  );
}
