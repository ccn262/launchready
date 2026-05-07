import { AppShell } from "@/components/app-shell";
import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { buildCapabilityBadges } from "@/lib/capability-badges";
import { getNextWeekendWindow, loadCrewAvailabilityContext } from "@/lib/phase6";

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
  const weekendWindow = getNextWeekendWindow();
  const badges = buildCapabilityBadges(
    data.crewQualifications.filter((qualification) => qualification.asset_id && qualification.operational_role_id),
  );

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

        <div className="grid gap-4 lg:grid-cols-2">
          <OperationalCard
            title="Crew view"
            tone="green"
            metric="Own rota assignments"
            summary="This page is intentionally read-only. Crew can see the periods they have been assigned against station operations."
            details={[
              "Availability remains editable on the availability page.",
              "Admin and LOM staff can assign rota periods from the station view.",
              "DLA visibility follows the existing security model.",
            ]}
          />
          <OperationalCard
            title="Weekend duty window"
            tone="amber"
            metric="Fri 19:00 to Mon 07:00"
            summary={`Weekend rota planning runs from ${weekendWindow.startDateTimeLocal.replace("T", " ")} to ${weekendWindow.endDateTimeLocal.replace("T", " ")}.`}
            details={[
              "Crew can mark themselves unavailable for the weekend window.",
              "Manual rota assignment is supported in the admin page.",
              "Auto-generation and cover requests are backlog items.",
            ]}
          />
        </div>

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
              description="Assigned duty periods for the current station and crew member."
            >
              {data.dutyPeriods.length ? (
                <div className="space-y-4">
                  {data.dutyPeriods.map((period) => {
                    const location = period.station_location && !Array.isArray(period.station_location) ? period.station_location : null;
                    const asset = period.asset && !Array.isArray(period.asset) ? period.asset : null;
                    const role = period.operational_role && !Array.isArray(period.operational_role) ? period.operational_role : null;

                    return (
                      <div
                        key={period.id}
                        className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-card-foreground">
                              {period.period_kind.replace(/_/g, " ")}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatDateTime(period.starts_at)} to {formatDateTime(period.ends_at)}
                            </p>
                          </div>
                          <StatusPill tone={getPeriodTone(period.period_kind)}>
                            {period.is_active ? "Active" : "Inactive"}
                          </StatusPill>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {location ? <span className="rounded-full border border-white/10 px-3 py-1">{location.name}</span> : null}
                          {asset ? <span className="rounded-full border border-white/10 px-3 py-1">{asset.name}</span> : null}
                          {role ? <span className="rounded-full border border-white/10 px-3 py-1">{role.name}</span> : null}
                          <span className="rounded-full border border-white/10 px-3 py-1">{period.source}</span>
                        </div>

                        {period.notes ? (
                          <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            {period.notes}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
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
