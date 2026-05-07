import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type StatusTone = "green" | "amber" | "red" | "blue";

const toneClasses: Record<StatusTone, string> = {
  green: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
  amber: "border-amber-500/30 bg-amber-500/15 text-amber-200",
  red: "border-rose-500/30 bg-rose-500/15 text-rose-200",
  blue: "border-sky-500/30 bg-sky-500/15 text-sky-200",
};

export function StatusPill({
  tone,
  children,
}: Readonly<{
  tone: StatusTone;
  children: ReactNode;
}>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium tracking-wide",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}
