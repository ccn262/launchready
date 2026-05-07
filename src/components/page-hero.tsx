import { StatusPill } from "@/components/status-pill";

export function PageHero({
  title,
  eyebrow,
  summary,
}: Readonly<{
  title: string;
  eyebrow: string;
  summary: string;
}>) {
  return (
    <section className="mb-6 rounded-3xl border border-white/10 bg-card p-5 shadow-[0_18px_70px_-40px_rgba(0,0,0,0.8)] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-3xl space-y-3">
          <StatusPill tone="blue">{eyebrow}</StatusPill>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-card-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {summary}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
