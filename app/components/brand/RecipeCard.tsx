import type { ReactNode } from "react";
import { EmptyPhoto } from "./EmptyPhoto";
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
    <article className={cn("group bg-card", className)}>
      <div className="relative overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="aspect-[4/3] w-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.02]"
          />
        ) : (
          <EmptyPhoto
            name={name}
            className="transition-transform duration-200 ease-out group-hover:scale-[1.02]"
          />
        )}
        {action ? (
          <div className="absolute bottom-3 right-3 z-10">{action}</div>
        ) : null}
      </div>
      <div className="pt-3">
        {eyebrow ? (
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.06em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h3 className="font-serif text-xl font-semibold leading-snug text-foreground">
          {name}
        </h3>
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
        "rounded px-3 py-1.5 text-xs font-semibold shadow-sm transition-colors duration-150",
        active
          ? "bg-accent text-accent-foreground"
          : "bg-white/95 text-foreground hover:bg-white"
      )}
    >
      {active ? activeLabel : inactiveLabel}
    </button>
  );
}
