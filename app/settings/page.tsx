"use client";

import { useEffect, useState } from "react";
import {
  GROCERY_SECTION_NAMES,
  type GrocerySectionName,
  type Settings,
  type StapleItem,
} from "@/lib/types";
import {
  Button,
  LinkButton,
  fieldClassName,
  labelClassName
} from "../components/brand";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [staples, setStaples] = useState<StapleItem[]>([]);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [settingsRes, staplesRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/staples"),
        ]);
        const [settingsJson, staplesJson] = await Promise.all([
          settingsRes.json(),
          staplesRes.json(),
        ]);
        if (!settingsRes.ok) {
          throw new Error(settingsJson.error || "Failed to load settings");
        }
        if (!staplesRes.ok) {
          throw new Error(staplesJson.error || "Failed to load staples");
        }
        if (!cancelled) {
          setSettings(settingsJson as Settings);
          setStaples((staplesJson as { items: StapleItem[] }).items);
        }
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
      const [settingsRes, staplesRes] = await Promise.all([
        fetch("/api/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        }),
        fetch("/api/staples", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: staples }),
        }),
      ]);
      const [settingsJson, staplesJson] = await Promise.all([
        settingsRes.json(),
        staplesRes.json(),
      ]);
      if (!settingsRes.ok) {
        throw new Error(settingsJson.error || "Failed to save settings");
      }
      if (!staplesRes.ok) {
        throw new Error(staplesJson.error || "Failed to save staples");
      }
      setSettings(settingsJson as Settings);
      setStaples((staplesJson as { items: StapleItem[] }).items);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setBusy(false);
    }
  }

  const fields: {
    key:
      | "dinnersPerWeek"
      | "maxCookMinutes"
      | "noRepeatWeeks"
      | "servings"
      | "cookEffortTarget"
      | "noveltyTarget";
    label: string;
    hint: string;
  }[] = [
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
  const grocerySections = GROCERY_SECTION_NAMES;

  function updateStaple(id: string, changes: Partial<StapleItem>) {
    setStaples(staples.map((staple) => (staple.id === id ? { ...staple, ...changes } : staple)));
  }

  function addStaple() {
    setStaples([
      ...staples,
      {
        id: crypto.randomUUID(),
        name: "",
        section: "Other",
      },
    ]);
  }

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
              <div className="border-t border-border pt-5">
                <label className={labelClassName} htmlFor="include-staples">
                  Include household staples
                </label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    id="include-staples"
                    type="checkbox"
                    checked={settings.includeStaplesInGroceryList}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        includeStaplesInGroceryList: e.target.checked,
                      })
                    }
                  />
                  <span className="text-sm text-muted">
                    Add these recurring items to each grocery list.
                  </span>
                </div>
              </div>
              <div className="border-t border-border pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={labelClassName}>Household staples</p>
                    <p className="mt-1.5 text-[13px] text-meta">
                      Reusable basics; weekly one-off items still belong in Miscellaneous.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={addStaple}>
                    Add staple
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {staples.map((staple) => (
                    <div key={staple.id} className="flex flex-col gap-2 sm:flex-row">
                      <input
                        aria-label={`Staple name for ${staple.name || "new item"}`}
                        value={staple.name}
                        onChange={(e) => updateStaple(staple.id, { name: e.target.value })}
                        className={fieldClassName}
                        placeholder="Staple name"
                      />
                      <select
                        aria-label={`Store section for ${staple.name || "new item"}`}
                        value={staple.section}
                        onChange={(e) =>
                          updateStaple(staple.id, {
                            section: e.target.value as GrocerySectionName,
                          })
                        }
                        className={fieldClassName}
                      >
                        {grocerySections.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setStaples(staples.filter((item) => item.id !== staple.id))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
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
