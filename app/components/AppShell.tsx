"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

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
      <header className="sticky top-0 z-20 hidden border-b border-zinc-200 bg-background/95 backdrop-blur-sm sm:block dark:border-zinc-800">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-4 px-6">
          <p className="text-sm font-semibold tracking-tight">Weekly Meal Prep</p>
          <nav aria-label="Main" className="flex items-center gap-1">
            {primaryNav.map((item) => {
              const active = item.match(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                    active
                      ? "bg-zinc-100 text-foreground dark:bg-zinc-800"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }`}
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
              className={`inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                moreActive
                  ? "bg-zinc-100 text-foreground dark:bg-zinc-800"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-foreground dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              More
            </button>
          </nav>
        </div>
      </header>

      <div className="flex-1 pb-20 sm:pb-0">{children}</div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-background/95 backdrop-blur-sm sm:hidden dark:border-zinc-800"
      >
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {primaryNav.map((item) => {
            const active = item.match(pathname);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center px-2 text-xs font-medium ${
                    active
                      ? "text-foreground"
                      : "text-zinc-500 dark:text-zinc-400"
                  }`}
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
              className={`flex min-h-14 w-full flex-col items-center justify-center px-2 text-xs font-medium ${
                moreActive
                  ? "text-foreground"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              More
            </button>
          </li>
        </ul>
      </nav>

      <dialog
        ref={dialogRef}
        id={moreId}
        className="fixed inset-x-4 bottom-20 top-auto m-0 w-[calc(100%-2rem)] max-w-sm rounded-xl border border-zinc-200 bg-background p-0 text-foreground shadow-lg backdrop:bg-black/40 open:flex open:flex-col sm:inset-auto sm:top-1/2 sm:left-1/2 sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2 dark:border-zinc-800"
        onClose={() => setMoreOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setMoreOpen(false);
        }}
      >
        <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">More</h2>
        </div>
        <ul className="p-2">
          {moreLinks.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${
                    active
                      ? "bg-zinc-100 dark:bg-zinc-800"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                  onClick={() => setMoreOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-900"
            onClick={() => setMoreOpen(false)}
          >
            Close
          </button>
        </div>
      </dialog>
    </div>
  );
}
