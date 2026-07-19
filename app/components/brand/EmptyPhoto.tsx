import { cn } from "./cn";

const washes = [
  "bg-photo-wash-1",
  "bg-photo-wash-2",
  "bg-photo-wash-3",
] as const;

function hashName(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function EmptyPhoto({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const wash = washes[hashName(name) % washes.length];
  const letter = (name.trim().charAt(0) || "?").toUpperCase();

  return (
    <div
      className={cn(
        "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden",
        wash,
        className
      )}
      aria-hidden
    >
      <span className="font-serif text-6xl font-semibold text-foreground/25 select-none sm:text-7xl">
        {letter}
      </span>
    </div>
  );
}
