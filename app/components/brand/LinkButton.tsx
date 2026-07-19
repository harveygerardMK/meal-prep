import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-accent-soft",
  ghost: "bg-transparent text-foreground hover:bg-accent-soft",
};

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded px-[18px] py-2.5 text-sm font-semibold transition-colors duration-150",
        variants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}
