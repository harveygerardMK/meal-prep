import { cn } from "./cn";

export function MetaRow({
  items,
  className,
}: {
  items: Array<string | null | undefined>;
  className?: string;
}) {
  const visible = items.filter((item): item is string => Boolean(item && item.trim()));
  if (visible.length === 0) return null;

  return (
    <p className={cn("text-[13px] leading-snug text-meta", className)}>
      {visible.join(" · ")}
    </p>
  );
}
