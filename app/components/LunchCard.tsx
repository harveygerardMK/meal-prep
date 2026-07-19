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
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            {label} · repeats Mon–Fri
          </p>
          <h3 className="text-lg font-semibold">{lunch.name}</h3>
        </div>
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
      <ul className="mt-3 list-disc space-y-0.5 pl-5 text-sm text-zinc-600 dark:text-zinc-300">
        {lunch.ingredients.map((ing) => (
          <li key={ing}>{ing}</li>
        ))}
      </ul>
    </div>
  );
}
