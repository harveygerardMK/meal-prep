"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "./brand";

const primaryNav = [
  { href: "/", label: "Plan", match: (path: string) => path === "/" },
  {
    href: "/shopping",
    label: "Shop",
    match: (path: string) => path.startsWith("/shopping"),
  },
  {
    href: "/recipes",
    label: "Recipes",
    match: (path: string) => path.startsWith("/recipes"),
  },
] as const;

const moreLinks = [
  { href: "/import", label: "Import" },
  { href: "/settings", label: "Settings" },
] as const;

function isMoreActive(path: string) {
  return path.startsWith("/import") || path.startsWith("/settings");
}

function navLinkClass(active: boolean) {
  return cn(
    "transition-colors duration-150",
    active ? "text-foreground" : "text-muted hover:text-foreground"
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (moreOpen && !dialog.open) dialog.showModal();
    if (!moreOpen && dialog.open) dialog.close();
  }, [moreOpen]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  const moreActive = isMoreActive(pathname);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 hidden border-b border-border bg-background/95 backdrop-blur-sm sm:block">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="font-serif text-[22px] font-semibold tracking-tight text-foreground"
          >
            Meal Prep
          </Link>
          <nav aria-label="Main" className="flex items-center gap-5 text-sm font-medium">
            {primaryNav.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn("inline-flex min-h-11 items-center", navLinkClass(active))}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={moreId}
              aria-current={moreActive ? "page" : undefined}
              onClick={() => setMoreOpen(true)}
              className={cn("inline-flex min-h-11 items-center", navLinkClass(moreActive))}
            >
              More
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 pb-20 sm:pb-0">{children}</div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm sm:hidden"
      >
        <ul className="mx-auto grid max-w-6xl grid-cols-4">
          {primaryNav.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center px-2 text-xs font-semibold",
                    navLinkClass(active)
                  )}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              aria-expanded={moreOpen}
              aria-controls={moreId}
              aria-current={moreActive ? "page" : undefined}
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-14 w-full flex-col items-center justify-center px-2 text-xs font-semibold",
                navLinkClass(moreActive)
              )}
            >
              More
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        id={moreId}
        className="fixed inset-x-4 bottom-20 top-auto m-0 w-[calc(100%-2rem)] max-w-sm rounded border border-border bg-background p-0 text-foreground shadow-lg backdrop:bg-black/40 open:flex open:flex-col sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2"
        onClose={() => setMoreOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setMoreOpen(false);
        }}
      >
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-serif text-base font-semibold">More</h2>
        </div>
        <ul className="p-2">
          {moreLinks.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center rounded px-3 text-sm font-medium",
                    active ? "bg-accent-soft text-foreground" : "hover:bg-accent-soft"
                  )}
                  onClick={() => setMoreOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-border p-2">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded text-sm font-medium text-muted hover:bg-accent-soft hover:text-foreground"
            onClick={() => setMoreOpen(false)}
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
