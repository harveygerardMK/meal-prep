"use client";

import { useEffect, useState } from "react";
import { DinnerCard } from "./components/DinnerCard";
import { LunchCard } from "./components/LunchCard";
import { GroceryListView } from "./components/GroceryListView";
import {
  AppHeader,
  Button,
  HeaderNavLink,
  LinkButton,
  SectionHeading,
} from "./components/brand";
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
      <>
        <AppHeader
          nav={<HeaderNavLink href="/" active>This week</HeaderNavLink>}
          actions={
            <LinkButton href="/settings" variant="ghost">
              Settings
            </LinkButton>
          }
        />
        <main className="mx-auto max-w-6xl px-6 py-16 text-center text-muted">
          Loading this week&apos;s plan…
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader
        nav={<HeaderNavLink href="/" active>This week</HeaderNavLink>}
        actions={
          <>
            <LinkButton href="/settings" variant="secondary">
              Settings
            </LinkButton>
            <Button onClick={regenerate} disabled={busy} type="button">
              {busy ? "Shuffling…" : "Regenerate"}
            </Button>
          </>
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
          <SectionHeading description="Check off items as you shop.">
            Grocery List
          </SectionHeading>
          <GroceryListView sections={data.groceryList} />
        </section>
      </main>
    </>
  );
}
