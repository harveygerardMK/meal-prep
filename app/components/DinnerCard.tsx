"use client";

import { type FormEvent, useState } from "react";
import type { Dinner } from "@/lib/types";
import { CardActionButton, RecipeCard } from "./brand";

export function DinnerCard({
  dinner,
  dayLabel,
  locked,
  onToggleLock,
  onSaveCustomDinner,
  emphasized = false,
}: {
  dinner: Dinner;
  dayLabel: string;
  locked: boolean;
  onToggleLock: () => void;
  onSaveCustomDinner: (input: { name: string; ingredients: string[] }) => Promise<void>;
  emphasized?: boolean;
}) {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIngredients, setCustomIngredients] = useState("");
  const [savingCustom, setSavingCustom] = useState(false);

  async function saveCustomDinner(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = customName.trim();
    if (!name) return;

    setSavingCustom(true);
    try {
      await onSaveCustomDinner({
        name,
        ingredients: customIngredients
          .split("\n")
          .map((ingredient) => ingredient.trim())
          .filter(Boolean),
      });
      setCustomName("");
      setCustomIngredients("");
      setShowCustomForm(false);
    } finally {
      setSavingCustom(false);
    }
  }

  return (
    <RecipeCard
      name={dinner.name}
      eyebrow={emphasized ? `${dayLabel} · Focus` : dayLabel}
      meta={[
        `${dinner.cookMinutes} min`,
        dinner.protein,
        ...dinner.tags.slice(0, 3),
      ]}
      emphasized={emphasized}
      action={
        <CardActionButton
          active={locked}
          onClick={onToggleLock}
          activeLabel="Locked"
          inactiveLabel="Lock"
        />
      }
    >
      {dinner.ingredients.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={() => setShowIngredients((v) => !v)}
            className="min-h-11 text-sm font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline"
            aria-expanded={showIngredients}
          >
            {showIngredients ? "Hide ingredients" : "Show ingredients"}
          </button>
          {showIngredients ? (
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {dinner.ingredients.map((ing) => (
                <li key={ing} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-meta" aria-hidden />
                  <span>{ing}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setShowCustomForm((value) => !value)}
          className="min-h-11 text-sm font-semibold text-muted underline-offset-2 hover:text-foreground hover:underline"
          aria-expanded={showCustomForm}
        >
          {showCustomForm ? "Cancel" : "Type your own"}
        </button>
        {showCustomForm ? (
          <form className="mt-2 space-y-3" onSubmit={saveCustomDinner}>
            <label className="block text-sm font-semibold" htmlFor={`custom-name-${dayLabel}`}>
              Dinner name
            </label>
            <input
              id={`custom-name-${dayLabel}`}
              required
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              className="min-h-11 w-full border border-border bg-background px-3 text-sm"
            />
            <label className="block text-sm font-semibold" htmlFor={`custom-ingredients-${dayLabel}`}>
              Ingredients <span className="font-normal text-muted">(one per line, optional)</span>
            </label>
            <textarea
              id={`custom-ingredients-${dayLabel}`}
              value={customIngredients}
              onChange={(event) => setCustomIngredients(event.target.value)}
              className="min-h-24 w-full border border-border bg-background px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={savingCustom}
              className="min-h-11 rounded bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground shadow-sm transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingCustom ? "Saving…" : "Save custom dinner"}
            </button>
          </form>
        ) : null}
      </div>
    </RecipeCard>
  );
}
