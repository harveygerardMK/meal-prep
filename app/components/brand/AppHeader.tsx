import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

export function AppHeader({
  nav,
  actions,
  className,
}: {
  nav?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "border-b border-border bg-background",
        className
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-8">
          <Link
            href="/"
            className="font-serif text-[22px] font-semibold tracking-tight text-foreground"
          >
            Meal Prep
          </Link>
          {nav ? (
            <nav className="hidden items-center gap-5 text-sm font-medium text-muted sm:flex">
              {nav}
            </nav>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}

export function HeaderNavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "transition-colors duration-150 hover:text-foreground",
        active ? "text-foreground" : "text-muted"
      )}
    >
      {children}
    </Link>
  );
}
