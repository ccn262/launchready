import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { ReadinessBoard } from "@/components/readiness-board";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { loadCoverRequestOverview } from "@/lib/cover-requests";
import {
  initiateIncidentAction,
  saveIncidentDraftAction,
  updateIncidentStatusAction,
} from "@/app/incident-actions";
import { loadIncidentBoardData } from "@/lib/incidents";
import { loadReadinessSnapshot, type OperationType } from "@/lib/readiness";

export const dynamic = "force-dynamic";

function getQueryValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function toneForIncidentStatus(status: string) {
  switch (status) {
    case "active":
      return "green" as const;
    case "stood_down":
      return "amber" as const;
    case "cancelled":
      return "red" as const;
    case "closed":
      return "grey" as const;
    default:
      return "grey" as const;
  }
}

export default async function DlaLaunchPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const requestedOperationType = (getQueryValue(params.operationType) as OperationType) || "service";

  const snapshot = await loadReadinessSnapshot({
    pathname: "/dla/launch",
    requestedStationId,
    operationType: requestedOperationType,
    windowPreset: "current",
  });
  const coverOverview = await loadCoverRequestOverview("/dla/launch", snapshot.selectedStationId);
  const incidentBoard = await loadIncidentBoardData("/dla/launch", snapshot.selectedStationId);
  const stationActionPath = buildRedirectUrl("/dla/launch", {
    stationId: snapshot.selectedStationId,
    operationType: requestedOperationType,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="DLA / Launch"
          title="Launch initiation and incident control"
          summary="The launch screen shows advisory readiness, open cover requests, and incident tracking. It never authorises a launch."
        />

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <SectionShell
          title="Station and operation"
          description="Select the station and operation type to preview readiness before creating a draft incident."
        >
          <form method="get" className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-card-foreground">Station</span>
              <select
                name="stationId"
                defaultValue={snapshot.selectedStationId ?? ""}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
              >
                <option value="">Select station</option>
                {snapshot.stationOptions.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} · {station.organisation_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-card-foreground">Operation type</span>
              <select
                name="operationType"
                defaultValue={requestedOperationType}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
              >
                <option value="service">Service</option>
                <option value="exercise">Exercise</option>
                <option value="passage">Passage</option>
                <option value="boat_movement">Boat movement</option>
                <option value="assurance_activity">Assurance activity</option>
              </select>
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
              >
                Refresh preview
              </button>
            </div>
          </form>
        </SectionShell>

        <ReadinessBoard snapshot={snapshot} />

        <SectionShell
          title="Open cover requests affecting readiness"
          description="Open cover requests are advisory inputs to the launch decision and remain visible during initiation."
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
                      {item.requestLabel} · {item.roleName ?? item.crewTypeName ?? item.request.cover_type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <StatusPill tone={item.request.urgency === "urgent" ? "red" : "amber"}>{item.request.urgency}</StatusPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.request.reason}</p>
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
          title="Create launch draft"
          description="Select assets, capture the launch context, and save a draft before initiation."
        >
          <form action={saveIncidentDraftAction} className="space-y-5 rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <input type="hidden" name="station_id" value={snapshot.selectedStationId ?? ""} />
            <input type="hidden" name="return_path" value={stationActionPath} />
            <input type="hidden" name="operation_type" value={requestedOperationType} />
            <label className="space-y-2">
              <span className="text-sm font-medium text-card-foreground">Incident title</span>
              <input
                name="title"
                required
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                placeholder="e.g. Southend launch readiness check"
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">Incident type</span>
                <input
                  name="incident_type"
                  defaultValue="launch"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">Station location</span>
                <select
                  name="station_location_id"
                  defaultValue={snapshot.selectedStation?.id ? snapshot.locations[0]?.id ?? "" : ""}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                >
                  <option value="">No location selected</option>
                  {snapshot.locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">Notes</span>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                  placeholder="Operational context and free-text notes"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">Dynamic risk assessment notes</span>
                <textarea
                  name="dynamic_risk_assessment_notes"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                  placeholder="Recorded, not authorising"
                />
              </label>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-card-foreground">Select assets</p>
              <div className="grid gap-4 xl:grid-cols-2">
                {snapshot.stationSummary?.locations.map((location) => (
                  <div key={location.location.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-card-foreground">{location.location.name}</p>
                    <div className="mt-3 space-y-2">
                      {location.assets.map((asset) => (
                        <label key={asset.asset.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
                          <span className="flex items-center gap-2">
                            <input type="checkbox" name="asset_ids" value={asset.asset.id} className="h-4 w-4 rounded border-white/20 bg-transparent" />
                            <span className="text-sm text-card-foreground">{asset.asset.name}</span>
                          </span>
                          <StatusPill tone={asset.status === "launch_ready" ? "green" : asset.status === "not_launch_ready" || asset.status === "off_service" ? "red" : asset.status === "degraded" ? "amber" : "grey"}>
                            {asset.statusLabel}
                          </StatusPill>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="reset"
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
              >
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
              >
                Save draft
              </button>
            </div>
          </form>
        </SectionShell>

        <SectionShell
          title="Launch drafts and incidents"
          description="Drafts can be initiated from here; active incidents stay visible for tracking and response."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Drafts</p>
              {incidentBoard.draftIncidents.length ? (
                incidentBoard.draftIncidents.map((incident) => (
                  <article key={incident.incident.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-card-foreground">{incident.incident.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {incident.incident.operation_type.replace(/_/g, " ")} · {incident.selectedAssetNames.join(", ") || "No assets selected"}
                        </p>
                      </div>
                      <StatusPill tone={toneForIncidentStatus(incident.incident.status)}>{incident.statusLabel}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{incident.reporterName}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <form action={initiateIncidentAction}>
                        <input type="hidden" name="incident_id" value={incident.incident.id} />
                        <input type="hidden" name="return_path" value={stationActionPath} />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
                        >
                          Initiate launch
                        </button>
                      </form>
                      <form action={updateIncidentStatusAction}>
                        <input type="hidden" name="incident_id" value={incident.incident.id} />
                        <input type="hidden" name="status" value="cancelled" />
                        <input type="hidden" name="return_path" value={stationActionPath} />
                        <button
                          type="submit"
                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
                        >
                          Cancel draft
                        </button>
                      </form>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No draft incidents yet.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Active incidents</p>
              {incidentBoard.activeIncidents.length ? (
                incidentBoard.activeIncidents.map((incident) => (
                  <article key={incident.incident.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-card-foreground">{incident.incident.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {incident.incident.operation_type.replace(/_/g, " ")} · {incident.selectedAssetNames.join(", ") || "No assets selected"}
                        </p>
                      </div>
                      <StatusPill tone={toneForIncidentStatus(incident.incident.status)}>{incident.statusLabel}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {incident.reporterName} · {incident.launchAuthorityName ?? "No launch authority"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-white/10 px-3 py-1">Attending {incident.attendingCount}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">Delayed {incident.delayedCount}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1">Fallback {incident.fallbackAvailableCount}</span>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No active incidents for the selected station.
                </div>
              )}
            </div>
          </div>
        </SectionShell>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dla/incidents"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Open incident board
          </Link>
          <Link
            href="/dla"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Back to DLA
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
