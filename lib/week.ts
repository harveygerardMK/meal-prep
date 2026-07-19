export function weekStartISO(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}

/** Parse `YYYY-MM-DD` as a local calendar date (no UTC shift). */
export function parseLocalDateISO(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDaysLocal(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function weekdayShort(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: "short" });
}

/** Dinner slots map to Mon, Tue, … of `weekOf` in order. */
export function dinnerSlotDate(weekOf: string, index: number): Date {
  return addDaysLocal(parseLocalDateISO(weekOf), index);
}

export type DinnerFocus = {
  index: number;
  kind: "tonight" | "up_next";
  dayLabel: string;
};

/** Pick tonight’s dinner, or the next upcoming slot in the week. */
export function resolveDinnerFocus(
  weekOf: string,
  dinnerCount: number,
  now: Date = new Date()
): DinnerFocus | null {
  if (dinnerCount <= 0) return null;
  const today = startOfLocalDay(now);

  for (let i = 0; i < dinnerCount; i++) {
    const slotDay = startOfLocalDay(dinnerSlotDate(weekOf, i));
    if (slotDay.getTime() === today.getTime()) {
      return { index: i, kind: "tonight", dayLabel: weekdayShort(slotDay) };
    }
    if (slotDay.getTime() > today.getTime()) {
      return { index: i, kind: "up_next", dayLabel: weekdayShort(slotDay) };
    }
  }

  const last = dinnerCount - 1;
  const lastDay = dinnerSlotDate(weekOf, last);
  return {
    index: last,
    kind: "up_next",
    dayLabel: weekdayShort(lastDay),
  };
}
