"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { GrocerySection } from "@/lib/groceryList";
import { LinkButton } from "./brand";

export const groceryStorageKey = (weekOf: string) =>
  `meal-prep:grocery-checked:${weekOf}`;
const changeEvent = (weekOf: string) => `meal-prep:grocery-changed:${weekOf}`;

function readRaw(weekOf: string): string {
  try {
    return localStorage.getItem(groceryStorageKey(weekOf)) ?? "[]";
  } catch {
    return "[]";
  }
}

function parseChecked(raw: string): Set<string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

function itemCheckKey(item: { name: string; checkKey?: string }) {
  return item.checkKey ?? item.name;
}

export function flattenGroceryItems(sections: GrocerySection[]) {
  return sections.flatMap((section) =>
    section.items.map((item) => ({
      section: section.section,
      name: item.name,
      checkKey: itemCheckKey(item),
      details: item.entries.map((e) => e.text).join("; "),
    }))
  );
}

export function useCheckedGroceryItems(weekOf: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const onChange = () => onStoreChange();
      window.addEventListener("storage", onChange);
      window.addEventListener(changeEvent(weekOf), onChange);
      return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener(changeEvent(weekOf), onChange);
      };
    },
    [weekOf]
  );

  const getSnapshot = useCallback(() => readRaw(weekOf), [weekOf]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  return useMemo(() => parseChecked(raw), [raw]);
}

export function toggleGroceryChecked(weekOf: string, key: string, checked: Set<string>) {
  const next = new Set(checked);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  localStorage.setItem(groceryStorageKey(weekOf), JSON.stringify([...next]));
  window.dispatchEvent(new Event(changeEvent(weekOf)));
}

export function GroceryListView({
  sections,
  weekOf,
  onMiscRemoved,
}: {
  sections: GrocerySection[];
  weekOf: string;
  onMiscRemoved?: (groceryList: GrocerySection[]) => void;
}) {
  const checked = useCheckedGroceryItems(weekOf);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function removeMisc(miscId: string) {
    setRemovingId(miscId);
    setError(null);
    try {
      const res = await fetch("/api/grocery/misc", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: miscId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not remove item");
      onMiscRemoved?.(json.groceryList as GrocerySection[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove item");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-accent" role="alert">
          {error}
        </p>
      )}
      <div className="grid gap-8 sm:grid-cols-2">
        {sections.map((section) => (
          <div key={section.section} className="border-t border-border pt-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              {section.section}
            </h3>
            <ul className="space-y-3 text-sm">
              {section.items.map((item) => {
                const key = itemCheckKey(item);
                const isChecked = checked.has(key);
                return (
                  <li key={key} className="flex items-start gap-2">
                    <label className="flex min-h-11 flex-1 cursor-pointer items-start gap-3 py-1">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 accent-[var(--accent)]"
                        checked={isChecked}
                        onChange={() => toggleGroceryChecked(weekOf, key, checked)}
                      />
                      <span className={isChecked ? "opacity-60 line-through" : undefined}>
                        <span className="font-medium capitalize text-foreground">
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-[13px] text-meta">
                          {item.entries.map((e) => e.text).join("; ")}
                        </span>
                      </span>
                    </label>
                    {item.miscId && (
                      <button
                        type="button"
                        onClick={() => removeMisc(item.miscId!)}
                        disabled={removingId === item.miscId}
                        className="min-h-11 shrink-0 px-2 text-sm font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
                      >
                        {removingId === item.miscId ? "…" : "Remove"}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GrocerySummary({
  sections,
  weekOf,
}: {
  sections: GrocerySection[];
  weekOf: string;
}) {
  const checked = useCheckedGroceryItems(weekOf);
  const items = flattenGroceryItems(sections);
  const unchecked = items.filter((item) => !checked.has(item.checkKey));
  const preview = unchecked.slice(0, 5);
  const remaining = Math.max(0, unchecked.length - preview.length);

  return (
    <div className="border-t border-border pt-4">
      <p className="text-sm text-muted">
        {items.length} items · {unchecked.length} still to get
      </p>
      {preview.length > 0 ? (
        <ul className="mt-3 space-y-1 text-sm">
          {preview.map((item) => (
            <li key={item.checkKey} className="capitalize text-foreground">
              {item.name}
            </li>
          ))}
          {remaining > 0 && (
            <li className="text-meta">+{remaining} more</li>
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Everything checked off for this week.
        </p>
      )}
      <LinkButton href="/shopping" className="mt-4">
        Open shopping list
      </LinkButton>
    </div>
  );
}
