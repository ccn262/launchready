import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { updateIncidentResponseAction } from "@/app/incident-actions";
import { loadIncidentBoardData } from "@/lib/incidents";

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
    default:
      return "grey" as const;
  }
}

function toneForResponse(status: string) {
  switch (status) {
    case "attending":
      return "green" as const;
    case "delayed":
      return "amber" as const;
    case "fallback_available":
      return "blue" as const;
    case "not_attending":
      return "red" as const;
    default:
      return "grey" as const;
  }
}

export default async function CrewIncidentsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const board = await loadIncidentBoardData("/crew/incidents", requestedStationId);
  const stationActionPath = buildRedirectUrl("/crew/incidents", { stationId: board.selectedStationId });
  const currentProfileId = board.context.user?.id ?? null;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Crew / Incidents"
          title="Active incidents and crew responses"
          summary="Crew can view active station incidents, see who is responding, and update their own response while the incident remains active."
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

        <SectionShell title="Station context" description="Choose your station if you belong to more than one.">
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

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Active", board.activeCount],
            ["Drafts hidden", board.draftCount],
            ["Responses", board.responseCount],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-card-foreground">{value as number}</p>
            </div>
          ))}
        </div>

        <SectionShell
          title="Active station incidents"
          description="Only active incidents are shown here. Crew can respond to the current callout and update that response while it remains open."
        >
          <div className="space-y-4">
            {board.activeIncidents.length ? (
              board.activeIncidents.map((incident) => {
                const myResponse = incident.responses.find((response) => response.profile_id === currentProfileId) ?? null;

                return (
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

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
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
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Attending {incident.attendingCount}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Delayed {incident.delayedCount}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Fallback {incident.fallbackAvailableCount}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Awaiting {incident.awaitingCount}</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Your response</p>
                      <form action={updateIncidentResponseAction} className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:grid-cols-2">
                        <input type="hidden" name="incident_id" value={incident.incident.id} />
                        <input type="hidden" name="return_path" value={stationActionPath} />
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-card-foreground">Response status</span>
                          <select
                            name="response_status"
                            defaultValue={myResponse?.response_status ?? "attending"}
                            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                          >
                            <option value="attending">Attending</option>
                            <option value="not_attending">Not attending</option>
                            <option value="delayed">Delayed</option>
                            <option value="fallback_available">Fallback available</option>
                          </select>
                        </label>
                        <label className="space-y-2">
                          <span className="text-sm font-medium text-card-foreground">ETA minutes</span>
                          <input
                            name="eta_minutes"
                            type="number"
                            min="0"
                            defaultValue={myResponse?.eta_minutes ?? ""}
                            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                            placeholder="Optional"
                          />
                        </label>
                        <label className="md:col-span-2 space-y-2">
                          <span className="text-sm font-medium text-card-foreground">Notes</span>
                          <textarea
                            name="notes"
                            rows={3}
                            defaultValue={myResponse?.notes ?? ""}
                            className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                            placeholder="Optional response notes"
                          />
                        </label>
                        <div className="md:col-span-2 flex flex-wrap justify-end gap-2">
                          <button
                            type="submit"
                            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
                          >
                            Save response
                          </button>
                        </div>
                      </form>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {myResponse ? (
                          <StatusPill tone={toneForResponse(myResponse.response_status)}>{myResponse.response_status.replace(/_/g, " ")}</StatusPill>
                        ) : (
                          <StatusPill tone="grey">No response recorded yet</StatusPill>
                        )}
                        {myResponse?.responded_at ? <span>{myResponse.responded_at}</span> : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                No active incidents are open for the selected station.
              </div>
            )}
          </div>
        </SectionShell>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/crew/cover"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Cover requests
          </Link>
          <Link
            href="/crew"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Back to crew
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
