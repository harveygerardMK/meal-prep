"use client";

import { useEffect, useState } from "react";
import { DinnerCard } from "./components/DinnerCard";
import { LunchCard } from "./components/LunchCard";
import { GroceryListView } from "./components/GroceryListView";
import {
  AppHeader,
  Button,
  SectionHeading,
  SiteNav,
} from "./components/brand";
import type { ResolvedWeekPlan, Locks, WeekPreferences } from "@/lib/types";
import type { GrocerySection } from "@/lib/groceryList";

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
      <>
        <AppHeader nav={<SiteNav active="plan" />} />
        <main className="mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="text-accent" role="alert">
            {error}
          </p>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <AppHeader nav={<SiteNav active="plan" />} />
        <main className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
          Loading this week&apos;s plan…
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        nav={<SiteNav active="plan" />}
        actions={
          <Button
            type="button"
            onClick={regenerate}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Shuffling…" : "Regenerate"}
          </Button>
        }
      />
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-10">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
            Weekly plan
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
            This Week&apos;s Plan
          </h1>
          <p className="mt-2 text-sm text-muted">Week of {data.plan.weekOf}</p>
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

        <section className="mb-12 border-t border-border pt-6">
          <SectionHeading description="Overrides settings defaults for the next regenerate.">
            This week&apos;s mix
          </SectionHeading>
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
        </section>

        <section className="mb-12">
          <SectionHeading>Dinners</SectionHeading>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
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

        <section>
          <SectionHeading description="Checkoffs stay on this device for the current week.">
            Grocery List
          </SectionHeading>
          <GroceryListView
            key={data.plan.weekOf}
            sections={data.groceryList}
            weekOf={data.plan.weekOf}
          />
        </section>
      </main>
    </>
  );
}
