"use client";

import { useEffect, useMemo, useState } from "react";
import { DinnerCard } from "./components/DinnerCard";
import { LunchCard } from "./components/LunchCard";
import { GrocerySummary } from "./components/GroceryListView";
import { MiscGroceryAdd } from "./components/MiscGroceryAdd";
import { Button, SectionHeading } from "./components/brand";
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
    const beforeDinnerIds = data.plan.dinners.map((d) => d.id);
    const beforeGirl = data.plan.girlLunch.id;
    const beforeBoy = data.plan.boyLunch.id;
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
      const next = json as PlanResponse;
      setData(next);
      setLockedDinners(next.plan.locks.dinners.map((id: string | null) => id !== null));
      setLockedGirl(next.plan.locks.girlLunch !== null);
      setLockedBoy(next.plan.locks.boyLunch !== null);
      setPreferences(next.plan.preferences);

      const dinnersChanged = next.plan.dinners.some(
        (d, i) => d.id !== beforeDinnerIds[i]
      );
      const lunchesChanged =
        next.plan.girlLunch.id !== beforeGirl ||
        next.plan.boyLunch.id !== beforeBoy;
      if (dinnersChanged || lunchesChanged) {
        setStatus("Plan updated — unlocked meals were reshuffled.");
      } else {
        setStatus(
          "No different meals fit your current settings. Try adjusting effort/originality or unlocking other days."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to regenerate plan");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center">
        <p className="text-accent" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
        Loading this week&apos;s plan…
      </main>
    );
  }

  const focusDinner =
    focus != null ? data.plan.dinners[focus.index] : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
            Weekly plan
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
            This Week&apos;s Plan
          </h1>
          <p className="mt-2 text-sm text-muted">Week of {data.plan.weekOf}</p>
        </div>
        <Button
          type="button"
          onClick={() => setConfirmRegen(true)}
          disabled={busy}
          aria-busy={busy}
        >
          {busy ? "Shuffling…" : "Regenerate"}
        </Button>
      </div>

      {error && (
        <p className="mb-4 text-sm text-accent" role="alert">
          {error}
        </p>
      )}
      {status && (
        <p className="mb-4 text-sm text-success" aria-live="polite">
          {status}
        </p>
      )}

      {confirmRegen && (
        <div
          className="mb-8 border border-border bg-accent-soft p-4"
          role="alertdialog"
          aria-labelledby="regen-title"
          aria-describedby="regen-desc"
        >
          <h2 id="regen-title" className="font-serif text-lg font-semibold">
            Reshuffle unlocked meals?
          </h2>
          <p id="regen-desc" className="mt-2 text-sm text-muted">
            {willReshuffle.length === 0
              ? "Everything is Locked — regenerate will not change meals."
              : `Will reshuffle: ${willReshuffle.join(", ")}.`}
          </p>
          <p className="mt-1 text-sm text-muted">
            Meals marked Locked stay as they are.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={regenerate}
              disabled={busy || willReshuffle.length === 0}
            >
              Confirm reshuffle
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmRegen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {focusDinner && focus && (
        <section className="mb-12 border-t border-border pt-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
            {focus.kind === "tonight"
              ? "Tonight"
              : focus.kind === "week_done"
                ? "Last dinner"
                : "Up next"}{" "}
            · {focus.dayLabel}
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">
            {focusDinner.name}
          </h2>
          <p className="mt-2 text-sm text-meta">
            {focusDinner.cookMinutes} min · {focusDinner.protein}
          </p>
        </section>
      )}

      <section className="mb-12">
        <SectionHeading>Dinners</SectionHeading>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="mb-12">
        <SectionHeading description="Same lunch Monday through Friday.">
          Lunches
        </SectionHeading>
        <div className="grid gap-8 sm:grid-cols-2">
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

      <details className="mb-12 border-t border-border open:pb-2">
        <summary className="cursor-pointer list-none py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="inline-flex min-h-11 items-center font-serif text-xl font-semibold">
            Adjust this week
          </span>
        </summary>
        <div className="space-y-4 pb-2">
          <p className="text-sm text-muted">
            Overrides settings defaults for the next regenerate.
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="cook-effort" className="mb-1.5 block text-sm font-semibold">
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
                className="w-full accent-[var(--accent)]"
              />
            </div>
            <div>
              <label htmlFor="novelty" className="mb-1.5 block text-sm font-semibold">
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
                className="w-full accent-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      </details>

      <section>
        <SectionHeading description="Checkoffs stay on this device. Extras you add are saved for the household this week.">
          Grocery
        </SectionHeading>
        <div className="space-y-8">
          <GrocerySummary
            key={data.plan.weekOf}
            sections={data.groceryList}
            weekOf={data.plan.weekOf}
          />
          <div className="border-t border-border pt-4">
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
