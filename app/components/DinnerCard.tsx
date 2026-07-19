import type { Dinner } from "@/lib/types";

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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold">{dinner.name}</h3>
        <button
          onClick={onToggleLock}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            locked
              ? "bg-amber-500 text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {locked ? "Locked" : "Lock"}
        </button>
      </div>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        {dinner.cookMinutes} min · {dinner.protein}
      </p>
      {dinner.ingredients.length > 0 && (
        <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
          {dinner.ingredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
