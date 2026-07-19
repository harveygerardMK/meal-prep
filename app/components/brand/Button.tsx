import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-foreground hover:bg-accent-hover disabled:opacity-50",
  secondary:
    "border border-border bg-transparent text-foreground hover:bg-accent-soft disabled:opacity-50",
  ghost: "bg-transparent text-foreground hover:bg-accent-soft disabled:opacity-50",
};

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded px-[18px] py-2.5 text-sm font-semibold transition-colors duration-150",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
