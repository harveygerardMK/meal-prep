"use client";

import { useEffect, useMemo, useState } from "react";
import { DinnerCard } from "./components/DinnerCard";
import { LunchCard } from "./components/LunchCard";
import { GrocerySummary } from "./components/GroceryListView";
import { MiscGroceryAdd } from "./components/MiscGroceryAdd";
import type { ResolvedWeekPlan, Locks, WeekPreferences } from "@/lib/types";
import type { GrocerySection } from "@/lib/groceryList";
import {
  dinnerSlotDate,
  resolveDinnerFocus,
  weekdayShort,
} from "@/lib/week";

type PlanResponse = { plan: ResolvedWeekPlan; groceryList: GrocerySection[] };

export default function Home() {
  const [data, setData] = useState<PlanResponse | null>(null);
  const [lockedDinners, setLockedDinners] = useState<boolean[]>([]);
  const [lockedGirl, setLockedGirl] = useState(false);
  const [lockedBoy, setLockedBoy] = useState(false);
  const [preferences, setPreferences] = useState<WeekPreferences>({
    cookEffortTarget: 3,
    noveltyTarget: 3,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [confirmRegen, setConfirmRegen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function applyPlan(json: PlanResponse) {
      if (cancelled) return;
      setData(json);
      setLockedDinners(json.plan.locks.dinners.map((id: string | null) => id !== null));
      setLockedGirl(json.plan.locks.girlLunch !== null);
      setLockedBoy(json.plan.locks.boyLunch !== null);
      setPreferences(json.plan.preferences);
    }

    async function load() {
      setError(null);
      try {
        const res = await fetch("/api/plan");
        const json = await res.json();
        if (res.status === 404 && json.code === "NO_PLAN") {
          const created = await fetch("/api/plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "ensure" }),
          });
          const createdJson = await created.json();
          if (!created.ok) {
            throw new Error(createdJson.error || "Failed to create this week's plan");
          }
          await applyPlan(createdJson as PlanResponse);
          return;
        }
        if (!res.ok) {
          throw new Error(json.error || "Failed to load this week's plan");
        }
        await applyPlan(json as PlanResponse);
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

  const focus = useMemo(() => {
    if (!data) return null;
    return resolveDinnerFocus(data.plan.weekOf, data.plan.dinners.length);
  }, [data]);

  const willReshuffle = useMemo(() => {
    if (!data) return [] as string[];
    const labels: string[] = [];
    data.plan.dinners.forEach((_, i) => {
      if (!lockedDinners[i]) {
        labels.push(weekdayShort(dinnerSlotDate(data.plan.weekOf, i)));
      }
    });
    if (!lockedGirl) labels.push("Girl lunch");
    if (!lockedBoy) labels.push("Boy lunch");
    return labels;
  }, [data, lockedDinners, lockedGirl, lockedBoy]);

  async function regenerate() {
    if (!data) return;
    setBusy(true);
    setError(null);
    setStatus(null);
    setConfirmRegen(false);
    try {
      const locks: Locks = {
        dinners: data.plan.dinners.map((d, i) => (lockedDinners[i] ? d.id : null)),
        girlLunch: lockedGirl ? data.plan.girlLunch.id : null,
        boyLunch: lockedBoy ? data.plan.boyLunch.id : null,
      };
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate", locks, preferences }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to regenerate plan");
      }
      setData(json as PlanResponse);
      setLockedDinners(json.plan.locks.dinners.map((id: string | null) => id !== null));
      setLockedGirl(json.plan.locks.girlLunch !== null);
      setLockedBoy(json.plan.locks.boyLunch !== null);
      setPreferences(json.plan.preferences);
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

  const focusDinner =
    focus != null ? data.plan.dinners[focus.index] : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-wrap-balance">This Week&apos;s Plan</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Week of {data.plan.weekOf}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmRegen(true)}
          disabled={busy}
          aria-busy={busy}
          className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? "Shuffling…" : "Regenerate"}
        </button>
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

      {confirmRegen && (
        <div
          className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900"
          role="alertdialog"
          aria-labelledby="regen-title"
          aria-describedby="regen-desc"
        >
          <h2 id="regen-title" className="text-base font-semibold">
            Reshuffle unlocked meals?
          </h2>
          <p id="regen-desc" className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            {willReshuffle.length === 0
              ? "Everything is marked Keep — regenerate will not change meals."
              : `Will reshuffle: ${willReshuffle.join(", ")}.`}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Meals marked Keep stay as they are.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={regenerate}
              disabled={busy || willReshuffle.length === 0}
              className="min-h-11 rounded-lg bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
            >
              Confirm reshuffle
            </button>
            <button
              type="button"
              onClick={() => setConfirmRegen(false)}
              className="min-h-11 rounded-lg border border-zinc-200 px-4 text-sm font-medium dark:border-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {focusDinner && focus && (
        <section className="mb-8 rounded-xl border border-foreground/20 bg-zinc-50 p-5 dark:border-zinc-600 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {focus.kind === "tonight" ? "Tonight" : "Up next"} · {focus.dayLabel}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-wrap-balance">{focusDinner.name}</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            {focusDinner.cookMinutes} min · {focusDinner.protein}
          </p>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Dinners</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {data.plan.dinners.map((dinner, i) => (
            <DinnerCard
              key={`${dinner.id}-${i}`}
              dinner={dinner}
              dayLabel={weekdayShort(dinnerSlotDate(data.plan.weekOf, i))}
              locked={lockedDinners[i] ?? false}
              emphasized={focus?.index === i}
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

      <details className="mb-8 rounded-xl border border-zinc-200 bg-white open:pb-4 dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer list-none px-4 py-3 text-base font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex min-h-11 items-center">Adjust this week</span>
        </summary>
        <div className="space-y-4 px-4 pt-1">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Overrides settings defaults for the next regenerate.
          </p>
          <div>
            <label htmlFor="cook-effort" className="mb-1 block text-sm font-medium">
              Cook effort: {preferences.cookEffortTarget} (easy → hard)
            </label>
            <input
              id="cook-effort"
              type="range"
              min={1}
              max={5}
              value={preferences.cookEffortTarget}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  cookEffortTarget: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
          <div>
            <label htmlFor="novelty" className="mb-1 block text-sm font-medium">
              Originality: {preferences.noveltyTarget} (familiar → new)
            </label>
            <input
              id="novelty"
              type="range"
              min={1}
              max={5}
              value={preferences.noveltyTarget}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  noveltyTarget: Number(e.target.value),
                })
              }
              className="w-full"
            />
          </div>
        </div>
      </details>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Grocery</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-300">
          Checkoffs stay on this device. Extras you add are saved for the household this week.
        </p>
        <div className="space-y-4">
          <GrocerySummary
            key={data.plan.weekOf}
            sections={data.groceryList}
            weekOf={data.plan.weekOf}
          />
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <MiscGroceryAdd
              onUpdated={(payload) => {
                setData((prev) =>
                  prev ? { ...prev, groceryList: payload.groceryList } : prev
                );
              }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}
