"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { GrocerySection } from "@/lib/groceryList";

const storageKey = (weekOf: string) => `meal-prep:grocery-checked:${weekOf}`;
const changeEvent = (weekOf: string) => `meal-prep:grocery-changed:${weekOf}`;

function readRaw(weekOf: string): string {
  try {
    return localStorage.getItem(storageKey(weekOf)) ?? "[]";
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

function useCheckedItems(weekOf: string) {
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

export function GroceryListView({
  sections,
  weekOf,
}: {
  sections: GrocerySection[];
  weekOf: string;
}) {
  const checked = useCheckedItems(weekOf);

  function toggle(name: string) {
    const next = new Set(checked);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    localStorage.setItem(storageKey(weekOf), JSON.stringify([...next]));
    window.dispatchEvent(new Event(changeEvent(weekOf)));
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {sections.map((section) => (
        <div key={section.section} className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {section.section}
          </h3>
          <ul className="space-y-3 text-sm">
            {section.items.map((item) => {
              const isChecked = checked.has(item.name);
              return (
                <li key={item.name}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--accent)]"
                      checked={isChecked}
                      onChange={() => toggle(item.name)}
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
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
