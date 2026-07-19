import type { ReactNode } from "react";
import { cn } from "./cn";

export function SectionHeading({
  children,
  description,
  className,
}: {
  children: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="flex items-center gap-3">
        <h2 className="shrink-0 text-[12px] font-bold uppercase tracking-[0.06em] text-foreground">
          {children}
        </h2>
        <div className="h-px flex-1 bg-border" aria-hidden />
      </div>
      {description ? (
        <p className="mt-2 text-sm text-muted">{description}</p>
      ) : null}
    </div>
  );
}
