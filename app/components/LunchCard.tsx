"use client";

import { useState } from "react";
import type { LunchOption } from "@/lib/types";

export function LunchCard({
  label,
  lunch,
  locked,
  onToggleLock,
}: {
  label: string;
  lunch: LunchOption;
  locked: boolean;
  onToggleLock: () => void;
}) {
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {label} · Mon–Fri
          </p>
          <h3 className="text-lg font-semibold text-wrap-balance">{lunch.name}</h3>
        </div>
        <button
          type="button"
          onClick={onToggleLock}
          aria-pressed={locked}
          className={`min-h-11 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors ${
            locked
              ? "bg-amber-500 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          }`}
        >
          {locked ? "Keeping" : "Keep"}
        </button>
      </div>
      {lunch.ingredients.length > 0 && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setShowIngredients((v) => !v)}
            className="min-h-11 text-sm font-medium text-zinc-700 underline-offset-2 hover:underline dark:text-zinc-200"
            aria-expanded={showIngredients}
          >
            {showIngredients ? "Hide ingredients" : "Show ingredients"}
          </button>
          {showIngredients && (
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
              {lunch.ingredients.map((ing) => (
                <li key={ing}>{ing}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
