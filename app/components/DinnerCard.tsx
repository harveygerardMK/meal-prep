import type { Dinner } from "@/lib/types";
import { CardActionButton, RecipeCard } from "./brand";

export function DinnerCard({
  dinner,
  locked,
  onToggleLock,
}: {
  dinner: Dinner;
  locked: boolean;
  onToggleLock: () => void;
}) {
  return (
    <RecipeCard
      name={dinner.name}
      meta={[
        `${dinner.cookMinutes} min`,
        dinner.protein,
        ...dinner.tags.slice(0, 3),
      ]}
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
        <ul className="space-y-1 text-sm text-muted">
          {dinner.ingredients.map((ing) => (
            <li key={ing} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-meta" aria-hidden />
              <span>{ing}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </RecipeCard>
  );
}
