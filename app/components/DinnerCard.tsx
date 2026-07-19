"use client";

import { useState } from "react";
import type { Dinner } from "@/lib/types";
import { CardActionButton, RecipeCard, cn } from "./brand";

export function DinnerCard({
  dinner,
  dayLabel,
  locked,
  onToggleLock,
  emphasized = false,
}: {
  dinner: Dinner;
  dayLabel: string;
  locked: boolean;
  onToggleLock: () => void;
  emphasized?: boolean;
}) {
  const [showIngredients, setShowIngredients] = useState(false);

  return (
    <RecipeCard
      name={dinner.name}
      eyebrow={emphasized ? `${dayLabel} · Focus` : dayLabel}
      meta={[
        `${dinner.cookMinutes} min`,
        dinner.protein,
        ...dinner.tags.slice(0, 3),
      ]}
      className={cn(emphasized && "ring-1 ring-accent/30")}
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
    </RecipeCard>
  );
}
