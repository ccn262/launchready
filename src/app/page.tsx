import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { ReadinessBoard } from "@/components/readiness-board";
import { loadCoverRequestOverview } from "@/lib/cover-requests";
import { loadIncidentBoardData } from "@/lib/incidents";
import { loadReadinessSnapshot } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const snapshot = await loadReadinessSnapshot({
    pathname: "/",
    requestedStationId: null,
    operationType: "service",
    windowPreset: "current",
  });
  const coverOverview = await loadCoverRequestOverview("/", snapshot.selectedStationId);
  const incidentBoard = await loadIncidentBoardData("/", snapshot.selectedStationId);
  const assets = snapshot.stationSummary?.locations.flatMap((location) => location.assets) ?? [];
  const readyCount = assets.filter((asset) => asset.status === "launch_ready").length;
  const degradedCount = assets.filter((asset) => asset.status === "degraded" || asset.status === "delayed_launch_possible").length;
  const offServiceCount = assets.filter((asset) => asset.status === "off_service" || asset.status === "not_launch_ready").length;
  const unknownCount = assets.filter((asset) => asset.status === "unknown" || asset.status === "non_sar_capable_exercise_only").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Operational dashboard"
          title="Readiness, cover, and current incidents"
          summary="A compact operational dashboard for quick scanning. Status, current jobs, cover, and launch support stay in one place."
        />

        <SectionShell
          title="Operational snapshot"
          description="The dashboard stays station-scoped, advisory only, and focused on what needs action next."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Station</p>
              <p className="mt-2 text-2xl font-semibold text-card-foreground">
                {snapshot.stationSummary?.stationName ?? "No station selected"}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {snapshot.stationSummary?.statusLabel ?? "No readiness data"}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Assets ready</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-200">{readyCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Launch-ready assets</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">At risk</p>
              <p className="mt-2 text-3xl font-semibold text-amber-200">{degradedCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Degraded or delayed-launch possible</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Off service</p>
              <p className="mt-2 text-3xl font-semibold text-rose-200">{offServiceCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">Not launch ready</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Unknown</p>
              <p className="mt-2 text-3xl font-semibold text-muted-foreground">{unknownCount}</p>
              <p className="mt-2 text-sm text-muted-foreground">No rule configured</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dla/launch"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Launch / create incident
            </Link>
            <Link
              href="/admin/readiness"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              View readiness
            </Link>
            <Link
              href="/dla/incidents"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              View incidents
            </Link>
            <Link
              href="/crew/cover"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Cover requests
            </Link>
          </div>
        </SectionShell>

        <ReadinessBoard snapshot={snapshot} />

        <SectionShell
          title="Open cover requests"
          description="Crew and station admins can track active cover needs alongside readiness without authorising launches."
        >
          {process.env.NODE_ENV !== "production" && coverOverview.debug ? (
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {[
                ["selectedStationId", coverOverview.debug.selectedStationId ?? "null"],
                ["currentProfileId", coverOverview.debug.currentProfileId ?? "null"],
                ["loadedCoverRequestCount", String(coverOverview.debug.loadedCoverRequestCount)],
                ["visibleOpenRequestCount", String(coverOverview.debug.visibleOpenRequestCount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm text-card-foreground">{value}</p>
                </div>
              ))}
            </div>
          ) : null}

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
                      {item.requestLabel} · {item.roleName ?? item.crewTypeName ?? item.request.cover_type.replace(/_/g, " ")}
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
          title="Active incidents"
          description="Current incident callouts stay visible alongside readiness so DLA and crew can track response activity."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Drafts", incidentBoard.draftCount],
              ["Active", incidentBoard.activeCount],
              ["Responses", incidentBoard.responseCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-card-foreground">{value as number}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-4">
            {incidentBoard.activeIncidents.slice(0, 3).map((incident) => (
              <div key={incident.incident.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{incident.incident.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {incident.incident.operation_type.replace(/_/g, " ")} · {incident.selectedAssetNames.join(", ") || "No assets selected"}
                    </p>
                  </div>
                  <StatusPill tone={incident.statusTone}>{incident.statusLabel}</StatusPill>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  Responses attending {incident.attendingCount} · delayed {incident.delayedCount} · fallback {incident.fallbackAvailableCount}
                </p>
              </div>
            ))}
            {!incidentBoard.activeIncidents.length ? (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                No active incidents are open for the selected station.
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
