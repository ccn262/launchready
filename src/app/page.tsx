import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { ReadinessBoard } from "@/components/readiness-board";
import { loadCoverRequestOverview } from "@/lib/cover-requests";
import { loadReadinessSnapshot } from "@/lib/readiness";

export default async function DashboardPage() {
  const snapshot = await loadReadinessSnapshot({
    pathname: "/",
    requestedStationId: null,
    operationType: "service",
    windowPreset: "current",
  });
  const coverOverview = await loadCoverRequestOverview("/", snapshot.selectedStationId);

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
          title="Open cover requests"
          description="Crew and station admins can track active cover needs alongside readiness without authorising launches."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Open", coverOverview.openCount],
              ["Urgent", coverOverview.urgentCount],
              ["Accepted", coverOverview.acceptedCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-card-foreground">{value as number}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-4">
            {coverOverview.requests.filter((item) => item.request.status === "open").slice(0, 3).map((item) => (
              <div key={item.request.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{item.requesterName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.assetName ?? "General cover"} · {item.roleName ?? item.crewTypeName ?? item.request.cover_type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusPill tone={item.request.urgency === "urgent" ? "red" : "amber"}>
                    {item.request.urgency}
                  </StatusPill>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.request.starts_at))} to {new Intl.DateTimeFormat("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.request.ends_at))}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.request.reason}</p>
              </div>
            ))}
            {!coverOverview.requests.filter((item) => item.request.status === "open").length ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                No open cover requests are active for the selected station.
              </div>
            ) : null}
          </div>
        </SectionShell>

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
