import { AppShell } from "@/components/app-shell";
import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { DashboardSummaryTile } from "@/components/dashboard-summary-tile";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import Link from "next/link";
import { buildCapabilityBadges } from "@/lib/capability-badges";
import { loadCrewAvailabilityContext } from "@/lib/phase6";

function getQueryValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getPeriodTone(periodKind: string) {
  switch (periodKind) {
    case "weekend_cover":
      return "amber" as const;
    case "night_cover":
    case "dla_night":
      return "blue" as const;
    case "dla_day":
      return "green" as const;
    default:
      return "green" as const;
  }
}

function getRotaGroupTone(periodKind: string) {
  switch (periodKind) {
    case "night_cover":
    case "dla_night":
      return "blue" as const;
    case "weekend_cover":
      return "amber" as const;
    case "day_cover":
    case "dla_day":
      return "green" as const;
    default:
      return "grey" as const;
  }
}

function getRotaGroupLabel(periodKind: string) {
  switch (periodKind) {
    case "day_cover":
      return "Day cover";
    case "night_cover":
      return "Night cover";
    case "weekend_cover":
      return "Weekend cover";
    case "dla_day":
      return "DLA day";
    case "dla_night":
      return "DLA night";
    default:
      return periodKind.replace(/_/g, " ");
  }
}

export default async function CrewRotaPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadCrewAvailabilityContext("/crew/rota", requestedStationId);
  const badges = buildCapabilityBadges(
    data.crewQualifications.filter((qualification) => qualification.asset_id && qualification.operational_role_id),
  );
  const dayCoverCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "day_cover").length;
  const nightCoverCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "night_cover").length;
  const weekendCoverCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "weekend_cover").length;
  const dlaDayCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "dla_day").length;
  const dlaNightCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "dla_night").length;
  const unassignedCount = data.dutyPeriods.filter((period) => period.is_active && !period.profile_id).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Crew / Rota"
          title="Assigned rota periods"
          summary="Crew can review weeknight and weekend duty periods without changing station rota state."
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
          title="Rota summary"
          description="Duty rota shows assigned cover periods such as day cover, night cover, DLA duty and weekend cover."
        >
          <div className="grid gap-4 md:grid-cols-6">
            <DashboardSummaryTile label="Day cover" value={dayCoverCount} tone="green" />
            <DashboardSummaryTile label="Night cover" value={nightCoverCount} tone="blue" />
            <DashboardSummaryTile label="Weekend cover" value={weekendCoverCount} tone="amber" />
            <DashboardSummaryTile label="DLA day" value={dlaDayCount} tone="green" />
            <DashboardSummaryTile label="DLA night" value={dlaNightCount} tone="blue" />
            <DashboardSummaryTile label="Gaps / unassigned" value={unassignedCount} tone={unassignedCount > 0 ? "red" : "grey"} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/crew/cover"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Request cover
            </Link>
            <Link
              href="/crew/availability"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              View availability
            </Link>
          </div>
        </SectionShell>

        <SectionShell
          title="Station context"
          description="Select the station whose rota summary you want to review."
        >
          <form method="get" className="flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 space-y-2">
              <span className="text-sm font-medium text-card-foreground">Station</span>
              <select
                name="stationId"
                defaultValue={data.selectedStationId ?? ""}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
              >
                <option value="">Select station</option>
                {data.stationOptions.map((station) => (
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

        {data.selectedStationId ? (
          <>
            <SectionShell
              title="Crew capability badges"
              description="Reusable asset-specific badges to surface who can cover what."
            >
              {badges.length ? (
                <CrewCapabilityBadges items={badges} />
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No asset-specific role badges exist yet.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Rota assignments"
              description="Assigned duty periods grouped by duty type so the next duty is easy to spot."
            >
              {data.dutyPeriods.length ? (
                <div className="space-y-4">
                  {["day_cover", "night_cover", "weekend_cover", "dla_day", "dla_night", "launch_alert", "incident_cover", "training"].map(
                    (periodKind) => {
                      const periods = data.dutyPeriods.filter((period) => period.period_kind === periodKind);

                      if (!periods.length) {
                        return null;
                      }

                      return (
                        <details key={periodKind} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                          <summary className="cursor-pointer list-none outline-none">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-card-foreground">{getRotaGroupLabel(periodKind)}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{periods.length} assigned periods</p>
                              </div>
                              <StatusPill tone={getRotaGroupTone(periodKind)}>
                                {periods.some((period) => period.is_active) ? "Shown" : "Inactive"}
                              </StatusPill>
                            </div>
                          </summary>

                          <div className="mt-4 space-y-3">
                            {periods.map((period) => {
                              const location = period.station_location && !Array.isArray(period.station_location) ? period.station_location : null;
                              const asset = period.asset && !Array.isArray(period.asset) ? period.asset : null;
                              const role = period.operational_role && !Array.isArray(period.operational_role) ? period.operational_role : null;

                              return (
                                <details key={period.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                  <summary className="cursor-pointer list-none outline-none">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-medium text-card-foreground">
                                          {formatDateTime(period.starts_at)} to {formatDateTime(period.ends_at)}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {period.profile && !Array.isArray(period.profile)
                                            ? period.profile.display_name ?? period.profile.email ?? "Crew member"
                                            : "Crew member"}
                                        </p>
                                      </div>
                                      <StatusPill tone={getPeriodTone(period.period_kind)}>
                                        {period.is_active ? "Active" : "Inactive"}
                                      </StatusPill>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      {location ? <span className="rounded-full border border-white/10 px-3 py-1">{location.name}</span> : null}
                                      {asset ? <span className="rounded-full border border-white/10 px-3 py-1">{asset.name}</span> : null}
                                      {role ? <span className="rounded-full border border-white/10 px-3 py-1">{role.name}</span> : null}
                                      <span className="rounded-full border border-white/10 px-3 py-1">{period.source}</span>
                                    </div>
                                  </summary>

                                  {period.notes ? (
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{period.notes}</p>
                                  ) : null}
                                </details>
                              );
                            })}
                          </div>
                        </details>
                      );
                    },
                  )}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No rota periods are assigned to you yet.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell title="No station selected" description="Choose a station to load rota data.">
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to review your rota assignments.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
