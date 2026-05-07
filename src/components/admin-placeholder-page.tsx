import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";

export function AdminPlaceholderPage({
  eyebrow,
  title,
  summary,
  routeLabel,
  bullets,
}: Readonly<{
  eyebrow: string;
  title: string;
  summary: string;
  routeLabel: string;
  bullets: readonly string[];
}>) {
  return (
    <div className="space-y-6">
      <PageHero eyebrow={eyebrow} title={title} summary={summary} />

      <SectionShell
        title="Implementation focus"
        description="This page is intentionally read-only until the schema and RLS work are wired into the app."
      >
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
            <StatusPill tone="blue">{routeLabel}</StatusPill>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current/60" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <p className="text-sm font-medium text-emerald-100">
              Next build step
            </p>
            <p className="mt-2 text-sm leading-6 text-emerald-100/80">
              Convert this placeholder into a station-scoped management view
              backed by Supabase queries, RLS policies, and audit logging.
            </p>
            <div className="mt-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/15 px-4 py-2 text-sm font-medium text-emerald-50 transition hover:bg-emerald-400/20"
              >
                Back to admin overview
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>
    </div>
  );
}
