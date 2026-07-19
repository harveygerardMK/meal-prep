"use client";

import { useEffect, useState } from "react";
import {
  AppHeader,
  Button,
  HeaderNavLink,
  LinkButton,
} from "../components/brand";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings);
  }, []);

  async function save() {
    if (!settings) return;
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fields: { key: keyof Settings; label: string; hint: string }[] = [
    {
      key: "dinnersPerWeek",
      label: "Dinners per week",
      hint: "How many dinner recipes to plan (lunches are fixed at Mon–Fri).",
    },
    {
      key: "maxCookMinutes",
      label: "Max cook time (minutes)",
      hint: "Dinners longer than this are excluded from picks.",
    },
    {
      key: "noRepeatWeeks",
      label: "Don't repeat a meal within (weeks)",
      hint: "How far back to look before a dinner or lunch can be picked again.",
    },
    {
      key: "servings",
      label: "Servings",
      hint: "Reference only — ingredient amounts in recipes aren't auto-scaled yet.",
    },
  ];

  return (
    <>
      <AppHeader
        nav={
          <>
            <HeaderNavLink href="/">This week</HeaderNavLink>
            <HeaderNavLink href="/settings" active>
              Settings
            </HeaderNavLink>
          </>
        }
        actions={
          <LinkButton href="/" variant="secondary">
            Back to plan
          </LinkButton>
        }
      />
      <main className="mx-auto w-full max-w-xl px-6 py-10">
        {!settings ? (
          <p className="text-center text-muted">Loading settings…</p>
        ) : (
          <>
            <div className="mb-10">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
                Preferences
              </p>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">
                Settings
              </h1>
              <p className="mt-2 text-sm text-muted">
                Tune how the weekly plan is generated.
              </p>
            </div>

            <div className="space-y-6">
              {fields.map((field) => (
                <div key={field.key} className="border-t border-border pt-5">
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settings[field.key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        [field.key]: Number(e.target.value),
                      })
                    }
                    className="w-full rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-accent"
                  />
                  <p className="mt-1.5 text-[13px] text-meta">{field.hint}</p>
                </div>
              ))}
            </div>

            <Button onClick={save} type="button" className="mt-8">
              {saved ? "Saved!" : "Save settings"}
            </Button>
            {saved ? (
              <p className="mt-3 text-sm text-success" aria-live="polite">
                Settings saved.
              </p>
            ) : null}
          </>
        )}
      </main>
    </>
  );
}
