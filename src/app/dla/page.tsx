import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { ReadinessBoard } from "@/components/readiness-board";
import { loadCoverRequestOverview } from "@/lib/cover-requests";
import { loadIncidentBoardData } from "@/lib/incidents";
import { loadReadinessSnapshot } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export default async function DlaPage() {
  const snapshot = await loadReadinessSnapshot({
    pathname: "/dla",
    requestedStationId: null,
    operationType: "service",
    windowPreset: "current",
  });
  const coverOverview = await loadCoverRequestOverview("/dla", snapshot.selectedStationId);
  const incidentBoard = await loadIncidentBoardData("/dla", snapshot.selectedStationId);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="DLA section"
          title="Station readiness and duty cover control"
          summary="DLA users can view station readiness, missing roles, and duty context for their own station without touching launch authorisation."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <OperationalCard
            title="Readiness visibility"
            tone="green"
            metric="Station scope"
            summary="The readiness engine highlights missing hard-stop roles, qualified crew counts, and launch/recovery dependencies."
            details={[
              "Readiness is calculated per asset and then rolled up to the station.",
              "Crew availability and duty periods are part of the calculation.",
              "The output is advisory, not a launch authority.",
            ]}
          />
          <OperationalCard
            title="Operational boundaries"
            tone="amber"
            metric="Decision support only"
            summary="If a hard-stop role is missing, the asset will not be shown as launch-ready."
            details={[
              "Dynamic risk assessment may be recorded later.",
              "WhatsApp and SMS remain out of scope here.",
              "Launch initiation is not part of this phase.",
            ]}
          />
        </div>

        <ReadinessBoard snapshot={snapshot} />

        <SectionShell
          title="Cover request awareness"
          description="DLA users can review open station cover needs without managing them unless they also hold admin or LOM access."
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
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {item.request.reason}
                </p>
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
          title="Incident awareness"
          description="Launch drafts and active incidents stay visible to DLA and admin users for operational control."
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
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/dla/launch"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Open launch draft screen
            </Link>
            <Link
              href="/dla/incidents"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Open incident board
            </Link>
          </div>
        </SectionShell>
      </div>
    </AppShell>
  );
}
