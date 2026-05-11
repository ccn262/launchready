import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { IncidentResponseGroups } from "@/components/incident-response-groups";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { updateIncidentStatusAction } from "@/app/incident-actions";
import { loadIncidentBoardData } from "@/lib/incidents";

export const dynamic = "force-dynamic";

function getQueryValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

export default async function DlaIncidentsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const board = await loadIncidentBoardData("/dla/incidents", requestedStationId);
  const stationActionPath = buildRedirectUrl("/dla/incidents", { stationId: board.selectedStationId });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="DLA / Incidents"
          title="Incident and launch response board"
          summary="DLA and admin users can track active incidents, response counts, and state changes for their own station."
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

        <SectionShell title="Station context" description="Choose the station you want to review.">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 space-y-2">
              <span className="text-sm font-medium text-card-foreground">Station</span>
              <select
                name="stationId"
                defaultValue={board.selectedStationId ?? ""}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
              >
                <option value="">Select station</option>
                {board.stationOptions.map((station) => (
                  <option key={station.id} value={station.id}>
                    {station.name} · {station.organisation_name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Load station
            </button>
          </form>
        </SectionShell>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["Drafts", board.draftCount],
            ["Active", board.activeCount],
            ["Closed", board.closedCount],
            ["Cancelled", board.cancelledCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-card-foreground">{value as number}</p>
            </div>
          ))}
        </div>

        <SectionShell
          title="Active incidents"
          description="Active incidents stay visible for response tracking and state changes."
        >
          <div className="space-y-4">
              {board.activeIncidents.length ? (
                board.activeIncidents.map((incident) => (
                  <article key={incident.incident.id} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                      <p className="text-base font-semibold text-card-foreground">{incident.incident.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {incident.incident.operation_type.replace(/_/g, " ")} · {incident.stationLocationName ?? "No location selected"}
                        </p>
                      </div>
                      <StatusPill tone={toneForIncidentStatus(incident.incident.status)}>{incident.statusLabel}</StatusPill>
                    </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Reported by</p>
                        <p className="mt-2 text-sm text-card-foreground">{incident.reporterName}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Launch authority</p>
                      <p className="mt-2 text-sm text-card-foreground">{incident.launchAuthorityName ?? "Unassigned"}</p>
                    </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Selected assets</p>
                        <p className="mt-2 text-sm text-card-foreground">
                          {incident.selectedAssetNames.length ? incident.selectedAssetNames.join(", ") : "None selected"}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Casualty care</p>
                        <p className="mt-2 text-sm text-card-foreground">
                          {incident.responses.some((response) => response.hasCasualtyCare) ? "Available" : "Not confirmed"}
                        </p>
                      </div>
                    </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-card-foreground">
                      Attending {incident.attendingCount}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-card-foreground">
                      Delayed {incident.delayedCount}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-card-foreground">
                      Fallback {incident.fallbackAvailableCount}
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-card-foreground">
                      Awaiting {incident.awaitingCount}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <form action={updateIncidentStatusAction}>
                      <input type="hidden" name="incident_id" value={incident.incident.id} />
                      <input type="hidden" name="status" value="standing_down" />
                      <input type="hidden" name="return_path" value={stationActionPath} />
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
                      >
                        Stand down
                      </button>
                    </form>
                    <form action={updateIncidentStatusAction}>
                      <input type="hidden" name="incident_id" value={incident.incident.id} />
                      <input type="hidden" name="status" value="closed" />
                      <input type="hidden" name="return_path" value={stationActionPath} />
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
                      >
                        Close
                      </button>
                    </form>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Crew responses</p>
                    <div className="mt-2">
                      <IncidentResponseGroups responses={incident.responses} />
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                No active incidents for the selected station.
              </div>
            )}
          </div>
        </SectionShell>

        <SectionShell
          title="Draft and recent incidents"
          description="Drafts remain visible for initiation, and recent incidents remain available for reference."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Drafts</p>
              {board.draftIncidents.length ? (
                board.draftIncidents.map((incident) => (
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
                    <p className="mt-3 text-sm text-muted-foreground">{formatDateTime(incident.incident.created_at)}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No draft incidents.
                </div>
              )}
            </div>

            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Recent incidents</p>
              {board.recentIncidents.length ? (
                board.recentIncidents.map((incident) => (
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
                      {incident.reporterName} · {formatDateTime(incident.incident.created_at)}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No recent incidents.
                </div>
              )}
            </div>
          </div>
        </SectionShell>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dla/launch"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Open launch draft screen
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
