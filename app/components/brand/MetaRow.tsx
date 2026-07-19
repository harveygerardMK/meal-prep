import { cn } from "./cn";

/** Case-insensitive de-dupe while preserving first-seen casing/order. */
export function uniqueMetaItems(
  items: Array<string | null | undefined>
): string[] {
  const seen = new Set<string>();
  const visible: string[] = [];
  for (const item of items) {
    if (!item?.trim()) continue;
    const key = item.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    visible.push(item.trim());
  }
  return visible;
}

export function MetaRow({
  items,
  className,
}: {
  items: Array<string | null | undefined>;
  className?: string;
}) {
  const visible = uniqueMetaItems(items);
  if (visible.length === 0) return null;

  return (
    <p className={cn("text-[13px] leading-snug text-meta", className)}>
      {visible.join(" · ")}
    </p>
  );
}
