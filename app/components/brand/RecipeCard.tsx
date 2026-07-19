/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { MetaRow } from "./MetaRow";
import { cn } from "./cn";

export function RecipeCard({
  name,
  eyebrow,
  meta,
  imageUrl,
  action,
  children,
  className,
}: {
  name: string;
  eyebrow?: string;
  meta?: Array<string | null | undefined>;
  imageUrl?: string | null;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group bg-card",
        imageUrl ? "" : "border-t border-border pt-4",
        className
      )}
    >
      {imageUrl ? (
        <div className="relative overflow-hidden">
          <img
            src={imageUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:scale-[1.02]"
          />
          {action ? (
            <div className="absolute bottom-3 right-3 z-10">{action}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cn(imageUrl && "pt-3")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow ? (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-accent-text">
                {eyebrow}
              </p>
            ) : null}
            <h3
              className={cn(
                "font-serif font-semibold leading-snug text-foreground",
                imageUrl ? "text-xl" : "text-2xl"
              )}
            >
              {name}
            </h3>
          </div>
          {!imageUrl && action ? <div className="shrink-0">{action}</div> : null}
        </div>
        {meta ? <MetaRow items={meta} className="mt-1.5" /> : null}
        {children ? <div className="mt-3">{children}</div> : null}
      </div>
    </article>
  );
}

export function CardActionButton({
  active,
  onClick,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  onClick: () => void;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 min-w-11 rounded px-3 py-2 text-xs font-semibold shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
        active
          ? "bg-accent text-accent-foreground"
          : "bg-white/95 text-foreground hover:bg-white"
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}
