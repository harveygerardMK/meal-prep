import { cn } from "./cn";

const washes = [
  "bg-photo-wash-1",
  "bg-photo-wash-2",
  "bg-photo-wash-3",
] as const;

const SKIP_WORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "air",
  "fryer",
  "&",
  "with",
  "of",
]);

function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Prefer meaningful initials so "Air Fryer …" cards do not all show "A". */
export function photoMonogram(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter((w) => w.length > 0 && !SKIP_WORDS.has(w.toLowerCase()));

  if (words.length === 0) {
    const fallback = name.trim().charAt(0);
    return (fallback || "?").toUpperCase();
  }
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export function EmptyPhoto({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const wash = washes[hashName(name) % washes.length];
  const letter = photoMonogram(name);

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden",
        wash,
        className
      )}
      aria-hidden
    >
      <span
        className={cn(
          "font-serif font-semibold text-foreground/25 select-none",
          letter.length > 1 ? "text-5xl sm:text-6xl" : "text-6xl sm:text-7xl"
        )}
      >
        {letter}
      </span>
    </div>
  );
}
