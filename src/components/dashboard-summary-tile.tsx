import Link from "next/link";

import { cn } from "@/lib/utils";

type DashboardTone = "green" | "amber" | "red" | "blue" | "grey";

const toneClasses: Record<DashboardTone, string> = {
  green: "border-emerald-500/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20",
  amber: "border-amber-500/30 bg-amber-500/15 text-amber-100 hover:bg-amber-500/20",
  red: "border-rose-500/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/20",
  blue: "border-sky-500/30 bg-sky-500/15 text-sky-100 hover:bg-sky-500/20",
  grey: "border-white/15 bg-white/5 text-muted-foreground hover:bg-white/10",
};

export function DashboardSummaryTile({
  label,
  value,
  tone,
  href,
  description,
}: Readonly<{
  label: string;
  value: string | number;
  tone: DashboardTone;
  href?: string;
  description?: string;
}>) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-[0.24em] opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      {description ? <p className="mt-2 text-sm opacity-80">{description}</p> : null}
    </>
  );

  const className = cn(
    "block rounded-3xl border p-4 text-left transition",
    toneClasses[tone],
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
