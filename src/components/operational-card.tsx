import { cn } from "@/lib/utils";
import { StatusPill } from "@/components/status-pill";

type OperationalTone = "green" | "amber" | "red" | "blue";

const toneStyles: Record<OperationalTone, string> = {
  green: "from-emerald-500/20 via-emerald-500/8 to-transparent",
  amber: "from-amber-500/20 via-amber-500/8 to-transparent",
  red: "from-rose-500/20 via-rose-500/8 to-transparent",
  blue: "from-sky-500/20 via-sky-500/8 to-transparent",
};

export function OperationalCard({
  title,
  tone,
  metric,
  summary,
  details,
}: Readonly<{
  title: string;
  tone: OperationalTone;
  metric: string;
  summary: string;
  details: readonly string[];
}>) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/10 bg-card p-5 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)]",
        "before:pointer-events-none before:absolute before:inset-0 before:content-[''] before:bg-gradient-to-br",
        toneStyles[tone],
      )}
    >
      <div className="relative flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              {title}
            </p>
            <p className="text-3xl font-semibold tracking-tight text-card-foreground">
              {metric}
            </p>
          </div>
          <StatusPill tone={tone}>
            {tone === "green" ? "Green" : tone === "amber" ? "Amber" : tone === "red" ? "Red" : "Blue"}
          </StatusPill>
        </div>
        <p className="max-w-xl text-sm leading-6 text-muted-foreground">
          {summary}
        </p>
        <ul className="space-y-2 text-sm text-card-foreground/90">
          {details.map((detail) => (
            <li key={detail} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current/60" />
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
