"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/lib/types";
import {
  Button,
  LinkButton,
  fieldClassName,
  labelClassName
} from "../components/brand";

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

  async function logout() {
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to log out");
      }
      window.location.href = "/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log out");
    }
  }

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
    {
      key: "cookEffortTarget",
      label: "Default cook effort (1 easy – 5 hard)",
      hint: "Default weekly slider for how elaborate dinners should feel.",
    },
    {
      key: "noveltyTarget",
      label: "Default originality (1 familiar – 5 new)",
      hint: "Default weekly slider for repeats vs trying something different.",
    },
  ];

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-10">
        {error && !settings ? (
          <p className="text-center text-accent" role="alert">
            {error}
          </p>
        ) : !settings ? (
          <p className="text-center text-muted">Loading settings…</p>
        ) : (
          <>
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
                  Preferences
                </p>
                <h1 className="font-serif text-4xl font-semibold tracking-tight">Settings</h1>
                <p className="mt-2 text-sm text-muted">
                  Tune how the weekly plan is generated.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <LinkButton href="/" variant="secondary">
                  Back to plan
                </LinkButton>
                <Button type="button" variant="ghost" onClick={logout}>
                  Log out
                </Button>
              </div>
            </div>

            {error && (
              <p className="mb-4 text-sm text-accent" role="alert">
                {error}
              </p>
            )}

            <div className="space-y-6">
              {fields.map((field) => {
                const inputId = `setting-${field.key}`;
                return (
                  <div key={field.key} className="border-t border-border pt-5">
                    <label htmlFor={inputId} className={labelClassName}>
                      {field.label}
                    </label>
                    <input
                      id={inputId}
                      type="number"
                      min={1}
                      max={
                        field.key === "cookEffortTarget" || field.key === "noveltyTarget"
                          ? 5
                          : undefined
                      }
                      value={settings[field.key]}
                      onChange={(e) =>
                        setSettings({ ...settings, [field.key]: Number(e.target.value) })
                      }
                      className={fieldClassName}
                    />
                    <p className="mt-1.5 text-[13px] text-meta">{field.hint}</p>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={save}
              disabled={busy}
              aria-busy={busy}
              className="mt-8"
            >
              {busy ? "Saving…" : saved ? "Saved!" : "Save settings"}
            </Button>
            {saved && (
              <p className="mt-3 text-sm text-success" aria-live="polite">
                Settings saved. Regenerate the plan on the home page to apply dinner-count or
                cook-time changes to this week.
              </p>
            )}
          </>
        )}
      </main>
  );
}
