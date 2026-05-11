import { AppShell } from "@/components/app-shell";
import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { DashboardSummaryTile } from "@/components/dashboard-summary-tile";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import Link from "next/link";
import { saveDutyPeriodAction } from "@/app/phase6-actions";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { buildCapabilityBadges } from "@/lib/capability-badges";
import { loadAdminAvailabilityContext, type DutyPeriodRecord } from "@/lib/phase6";

function getQueryValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
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

function getPeriodTone(period: DutyPeriodRecord) {
  switch (period.period_kind) {
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

function getDutyGroupLabel(periodKind: DutyPeriodRecord["period_kind"]) {
  switch (periodKind) {
    case "day_cover":
      return "Day";
    case "night_cover":
      return "Night";
    case "weekend_cover":
      return "Weekend";
    case "dla_day":
    case "dla_night":
      return "DLA";
    case "launch_alert":
      return "Launch";
    case "incident_cover":
      return "Incident";
    case "training":
      return "Training";
    default:
      return "Other";
  }
}

function getDutyGroupTone(periodKind: DutyPeriodRecord["period_kind"]) {
  switch (periodKind) {
    case "day_cover":
    case "dla_day":
      return "green" as const;
    case "night_cover":
    case "dla_night":
      return "blue" as const;
    case "weekend_cover":
      return "amber" as const;
    default:
      return "grey" as const;
  }
}

export default async function AdminDutyRotaPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadAdminAvailabilityContext("/admin/duty-rota", requestedStationId);
  const returnPath = buildRedirectUrl("/admin/duty-rota", { stationId: data.selectedStationId });
  const capabilityBadges = buildCapabilityBadges(
    data.crewQualifications.filter((qualification) => qualification.asset_id && qualification.operational_role_id),
  );
  const defaultStartDate = new Date();
  const defaultEndDate = new Date(defaultStartDate.getTime() + 8 * 60 * 60 * 1000);
  const defaultStart = toDateTimeLocalValue(defaultStartDate);
  const defaultEnd = toDateTimeLocalValue(defaultEndDate);
  const dayCoverCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "day_cover").length;
  const nightCoverCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "night_cover").length;
  const weekendCoverCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "weekend_cover").length;
  const dlaDayCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "dla_day").length;
  const dlaNightCount = data.dutyPeriods.filter((period) => period.is_active && period.period_kind === "dla_night").length;
  const unassignedCount = data.dutyPeriods.filter((period) => period.is_active && !period.profile_id).length;
  const groupedLocations = [
    ...data.locations.map((location) => {
      const periods = data.dutyPeriods.filter((period) => period.station_location_id === location.id);
      const profileIds = new Set(periods.map((period) => period.profile_id).filter((value): value is string => Boolean(value)));
      const locationQualifications = data.crewQualifications.filter((qualification) => profileIds.has(qualification.profile_id));

      return {
        key: location.id,
        title: location.name,
        periods,
        capabilityBadges: buildCapabilityBadges(locationQualifications),
        dayCount: periods.filter((period) => period.period_kind === "day_cover").length,
        nightCount: periods.filter((period) => period.period_kind === "night_cover").length,
        weekendCount: periods.filter((period) => period.period_kind === "weekend_cover").length,
        dlaCount: periods.filter((period) => period.period_kind === "dla_day" || period.period_kind === "dla_night").length,
      };
    }),
    {
      key: "station-wide",
      title: "Station-wide",
      periods: data.dutyPeriods.filter((period) => !period.station_location_id),
      capabilityBadges: [],
      dayCount: data.dutyPeriods.filter((period) => !period.station_location_id && period.period_kind === "day_cover").length,
      nightCount: data.dutyPeriods.filter((period) => !period.station_location_id && period.period_kind === "night_cover").length,
      weekendCount: data.dutyPeriods.filter((period) => !period.station_location_id && period.period_kind === "weekend_cover").length,
      dlaCount: data.dutyPeriods.filter((period) => !period.station_location_id && (period.period_kind === "dla_day" || period.period_kind === "dla_night")).length,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Duty rota"
          title="Duty rota"
          summary="Station admins and LOMs can manually assign weeknight, weekend, DLA day, and DLA night duty periods."
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
          title="Duty rota summary"
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
              href="/admin/availability"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              View availability
            </Link>
            <Link
              href="/admin/readiness"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              View readiness
            </Link>
          </div>
        </SectionShell>

        <SectionShell
          title="Readiness console"
          description="Readiness calculations use the same station context, so rota managers can compare assignments against launch readiness in one place."
        >
          <Link
            href="/admin/readiness"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Open readiness console
          </Link>
        </SectionShell>

        <SectionShell title="Station context" description="Pick the station you want to manage.">
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
              title="Manual duty assignment"
              description="Assign a duty period to a crew member with optional location, asset, and role context."
            >
              <form
                action={saveDutyPeriodAction}
                className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
              >
                <input type="hidden" name="station_id" value={data.selectedStationId} />
                <input type="hidden" name="return_path" value={returnPath} />
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Crew member</span>
                  <select
                    name="profile_id"
                    defaultValue={data.memberships[0]?.profile_id ?? ""}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No profile</option>
                    {data.memberships.map((membership) => {
                      const profile = membership.profile && !Array.isArray(membership.profile) ? membership.profile : null;

                      return (
                        <option key={membership.profile_id} value={membership.profile_id}>
                          {profile?.display_name ?? profile?.email ?? membership.profile_id}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Period kind</span>
                  <select
                    name="period_kind"
                    defaultValue="weekend_cover"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="day_cover">Day cover</option>
                    <option value="night_cover">Night cover</option>
                    <option value="weekend_cover">Weekend cover</option>
                    <option value="dla_day">DLA day</option>
                    <option value="dla_night">DLA night</option>
                    <option value="launch_alert">Launch alert</option>
                    <option value="incident_cover">Incident cover</option>
                    <option value="training">Training</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Duty date</span>
                  <input
                    type="date"
                    name="duty_date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Source</span>
                  <input
                    name="source"
                    defaultValue="manual"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Starts at</span>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    defaultValue={defaultStart}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Ends at</span>
                  <input
                    type="datetime-local"
                    name="ends_at"
                    defaultValue={defaultEnd}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Location</span>
                  <select
                    name="station_location_id"
                    defaultValue=""
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No location</option>
                    {data.locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Asset type</span>
                  <select
                    name="asset_type_id"
                    defaultValue=""
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No asset type</option>
                    {data.assetTypes.map((assetType) => (
                      <option key={assetType.id} value={assetType.id}>
                        {assetType.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Asset</span>
                  <select
                    name="asset_id"
                    defaultValue=""
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No asset</option>
                    {data.assets.map((asset) => {
                      const location = asset.station_location && !Array.isArray(asset.station_location) ? asset.station_location : null;

                      return (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} · {location?.name ?? "No location"}
                        </option>
                      );
                    })}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Role</span>
                  <select
                    name="operational_role_id"
                    defaultValue=""
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No role</option>
                    {data.operationalRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Notes</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                    placeholder="Optional note for the duty period"
                  />
                </label>
                <label className="flex items-center gap-3 text-sm text-card-foreground">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked
                    className="h-4 w-4 rounded border-white/20 bg-transparent"
                  />
                  Active
                </label>
                <div className="md:col-span-2 flex items-center justify-end gap-2">
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
                    Save duty period
                  </button>
                </div>
              </form>
            </SectionShell>

            <SectionShell
              title="Duty period dashboard"
              description="Station locations appear first, then duty periods are grouped by type so the rota is easy to scan."
            >
              {data.dutyPeriods.length ? (
                <div className="space-y-4">
                  {groupedLocations.map((group) => (
                    <details key={group.key} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <summary className="cursor-pointer list-none outline-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-card-foreground">{group.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {group.dayCount} day · {group.nightCount} night · {group.weekendCount} weekend · {group.dlaCount} DLA
                            </p>
                          </div>
                          <StatusPill tone={group.periods.some((period) => period.is_active) ? "green" : "grey"}>
                            {group.periods.some((period) => period.is_active) ? "Active" : "No active periods"}
                          </StatusPill>
                        </div>
                      </summary>

                      <div className="mt-4 space-y-4">
                        {group.capabilityBadges.length ? (
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Capability badges</p>
                            <div className="mt-2">
                              <CrewCapabilityBadges items={group.capabilityBadges} />
                            </div>
                          </div>
                        ) : null}

                        {[
                          "day_cover",
                          "night_cover",
                          "weekend_cover",
                          "dla_day",
                          "dla_night",
                          "launch_alert",
                          "incident_cover",
                          "training",
                        ].map((periodKind) => {
                          const periods = group.periods.filter((period) => period.period_kind === periodKind);

                          if (!periods.length) {
                            return null;
                          }

                          return (
                            <div key={periodKind} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-medium text-card-foreground">{getDutyGroupLabel(periodKind as DutyPeriodRecord["period_kind"])}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{periods.length} assigned periods</p>
                                </div>
                                <StatusPill tone={getDutyGroupTone(periodKind as DutyPeriodRecord["period_kind"])}>{periods.length}</StatusPill>
                              </div>
                              <div className="mt-3 space-y-2">
                                {periods.map((period) => {
                                  const profile = period.profile && !Array.isArray(period.profile) ? period.profile : null;
                                  const asset = period.asset && !Array.isArray(period.asset) ? period.asset : null;
                                  const role = period.operational_role && !Array.isArray(period.operational_role) ? period.operational_role : null;
                                  const location = period.station_location && !Array.isArray(period.station_location) ? period.station_location : null;

                                  return (
                                    <details key={period.id} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                                      <summary className="cursor-pointer list-none outline-none">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <p className="text-sm font-medium text-card-foreground">
                                              {profile?.display_name ?? profile?.email ?? "Crew member"}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                              {formatDateTime(period.starts_at)} to {formatDateTime(period.ends_at)}
                                            </p>
                                          </div>
                                          <StatusPill tone={getPeriodTone(period)}>{period.is_active ? "Active" : "Inactive"}</StatusPill>
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
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No duty periods have been assigned for this station yet.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Crew capability badges"
              description="Shared badge formatter for rota summaries."
            >
              {capabilityBadges.length ? (
                <CrewCapabilityBadges items={capabilityBadges} />
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  Add crew qualifications to show capability badges here.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell title="No station selected" description="Choose a station to load duty rota data.">
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to review or create duty periods.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
