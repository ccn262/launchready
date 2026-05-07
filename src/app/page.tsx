import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { ReadinessBoard } from "@/components/readiness-board";
import { loadReadinessSnapshot } from "@/lib/readiness";

export default async function DashboardPage() {
  const snapshot = await loadReadinessSnapshot({
    pathname: "/",
    requestedStationId: null,
    operationType: "service",
    windowPreset: "current",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Operational dashboard"
          title="Readiness, crew cover, and launch support in one view"
          summary="The dashboard now surfaces the first readiness engine calculation. It stays station-scoped, asset-aware, and non-authorising."
        />

        <ReadinessBoard snapshot={snapshot} />

        <SectionShell
          title="Operational control boundaries"
          description="The readiness engine supports decision-making only."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-muted-foreground">
              Hard-stop crew gaps prevent launch-ready status.
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-muted-foreground">
              Dynamic risk assessment can be recorded later, but never overrides missing hard-stop roles.
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-muted-foreground">
              Launch initiation, messaging, and automation remain out of scope for this phase.
            </div>
          </div>
        </SectionShell>
      </div>
    </AppShell>
  );
}
