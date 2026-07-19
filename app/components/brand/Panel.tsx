import type { ReactNode } from "react";
import { cn } from "./cn";

type PanelTone = "neutral" | "accent";

const toneClass: Record<PanelTone, string> = {
  neutral: "bg-surface border-surface-border",
  accent: "bg-accent-soft border-accent/20",
};

export function panelClass(tone: PanelTone = "neutral", className?: string) {
  return cn("rounded-lg border p-5 sm:p-6", toneClass[tone], className);
}

export function Panel({
  tone = "neutral",
  className,
  children,
}: {
  tone?: PanelTone;
  className?: string;
  children: ReactNode;
}) {
  return <div className={panelClass(tone, className)}>{children}</div>;
}
