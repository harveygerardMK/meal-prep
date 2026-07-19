import type { LunchOption } from "@/lib/types";
import { CardActionButton, RecipeCard } from "./brand";

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
  return (
    <RecipeCard
      name={lunch.name}
      eyebrow={`${label} · Mon–Fri`}
      meta={["Repeats each weekday"]}
      action={
        <CardActionButton
          active={locked}
          onClick={onToggleLock}
          activeLabel="Locked"
          inactiveLabel="Lock"
        />
      }
    >
      <ul className="space-y-1 text-sm text-muted">
        {lunch.ingredients.map((ing) => (
          <li key={ing} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-meta" aria-hidden />
            <span>{ing}</span>
          </li>
        ))}
      </ul>
    </RecipeCard>
  );
}
