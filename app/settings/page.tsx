"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const res = await fetch("/api/settings");
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to load settings");
        }
        if (!cancelled) setSettings(json as Settings);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load settings");
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    if (!settings) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save settings");
      }
      setSettings(json as Settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setBusy(false);
    }
  }

  if (error && !settings) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center">
        <p className="text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 text-center text-zinc-500">
        Loading settings…
      </main>
    );
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
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
        <Link
          href="/"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Back to plan
        </Link>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="space-y-5">
        {fields.map((field) => {
          const inputId = `setting-${field.key}`;
          return (
            <div key={field.key}>
              <label htmlFor={inputId} className="mb-1 block text-sm font-medium">
                {field.label}
              </label>
              <input
                id={inputId}
                type="number"
                min={1}
                value={settings[field.key]}
                onChange={(e) =>
                  setSettings({ ...settings, [field.key]: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{field.hint}</p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        aria-busy={busy}
        className="mt-8 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
      >
        {busy ? "Saving…" : saved ? "Saved!" : "Save settings"}
      </button>
      {saved && (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400" aria-live="polite">
          Settings saved. Regenerate the plan on the home page to apply dinner-count or cook-time
          changes to this week.
        </p>
      )}
    </main>
  );
}
