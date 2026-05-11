import { AppShell } from "@/components/app-shell";
import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { DashboardSummaryTile } from "@/components/dashboard-summary-tile";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import Link from "next/link";
import { saveStationAvailabilityAction } from "@/app/phase6-actions";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { buildCapabilityBadges } from "@/lib/capability-badges";
import { loadAdminAvailabilityContext, type AvailabilitySlotRecord } from "@/lib/phase6";

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

function getSlotTone(slot: AvailabilitySlotRecord) {
  switch (slot.slot_kind) {
    case "weekend_unavailable":
      return "red" as const;
    case "unavailable":
      return "amber" as const;
    case "night_cover":
      return "blue" as const;
    default:
      return "green" as const;
  }
}

function getAvailabilityStatusTone(availableCount: number, unavailableCount: number) {
  if (availableCount === 0 && unavailableCount === 0) {
    return "grey" as const;
  }

  if (availableCount > 0 && unavailableCount === 0) {
    return "green" as const;
  }

  if (availableCount > 0 && unavailableCount > 0) {
    return "amber" as const;
  }

  return "red" as const;
}

function getAvailabilitySummary(slotKind: AvailabilitySlotRecord["slot_kind"]) {
  switch (slotKind) {
    case "full_day":
      return "Full day";
    case "partial_day":
      return "Partial day";
    case "night_cover":
      return "Night cover";
    case "weekend_unavailable":
      return "Weekend unavailable";
    default:
      return "Unavailable";
  }
}

export default async function AdminAvailabilityPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadAdminAvailabilityContext("/admin/availability", requestedStationId);
  const returnPath = buildRedirectUrl("/admin/availability", { stationId: data.selectedStationId });
  const capabilityBadges = buildCapabilityBadges(
    data.crewQualifications.filter((qualification) => qualification.asset_id && qualification.operational_role_id),
  );
  const defaultStartDate = new Date();
  const defaultEndDate = new Date(defaultStartDate.getTime() + 8 * 60 * 60 * 1000);
  const defaultStart = toDateTimeLocalValue(defaultStartDate);
  const defaultEnd = toDateTimeLocalValue(defaultEndDate);
  const nowLabel = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());
  const groupedLocations = [
    ...data.locations.map((location) => {
      const slots = data.availabilitySlots.filter((slot) => slot.station_location_id === location.id);
      const profileIds = new Set(slots.map((slot) => slot.profile_id));
      const availableProfiles = new Set(
        slots.filter((slot) => slot.slot_kind === "full_day" || slot.slot_kind === "partial_day" || slot.slot_kind === "night_cover")
          .map((slot) => slot.profile_id),
      );
      const unavailableProfiles = new Set(
        slots.filter((slot) => slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable")
          .map((slot) => slot.profile_id),
      );
      const nightCoverCount = slots.filter((slot) => slot.slot_kind === "night_cover").length;
      const weekendUnavailableCount = slots.filter((slot) => slot.slot_kind === "weekend_unavailable").length;
      const locationQualifications = data.crewQualifications.filter((qualification) => profileIds.has(qualification.profile_id));

      return {
        key: location.id,
        title: location.name,
        slots,
        tone: getAvailabilityStatusTone(availableProfiles.size, unavailableProfiles.size),
        availableCount: availableProfiles.size,
        unavailableCount: unavailableProfiles.size,
        nightCoverCount,
        weekendUnavailableCount,
        capabilityBadges: buildCapabilityBadges(locationQualifications),
      };
    }),
    {
      key: "station-wide",
      title: "Station-wide",
      slots: data.availabilitySlots.filter((slot) => !slot.station_location_id),
      tone: getAvailabilityStatusTone(
        new Set(
          data.availabilitySlots
            .filter((slot) => !slot.station_location_id && (slot.slot_kind === "full_day" || slot.slot_kind === "partial_day" || slot.slot_kind === "night_cover"))
            .map((slot) => slot.profile_id),
        ).size,
        new Set(
          data.availabilitySlots
            .filter((slot) => !slot.station_location_id && (slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable"))
            .map((slot) => slot.profile_id),
        ).size,
      ),
      availableCount: new Set(
        data.availabilitySlots
          .filter((slot) => !slot.station_location_id && (slot.slot_kind === "full_day" || slot.slot_kind === "partial_day" || slot.slot_kind === "night_cover"))
          .map((slot) => slot.profile_id),
      ).size,
      unavailableCount: new Set(
        data.availabilitySlots
          .filter((slot) => !slot.station_location_id && (slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable"))
          .map((slot) => slot.profile_id),
      ).size,
      nightCoverCount: data.availabilitySlots.filter((slot) => !slot.station_location_id && slot.slot_kind === "night_cover").length,
      weekendUnavailableCount: data.availabilitySlots.filter((slot) => !slot.station_location_id && slot.slot_kind === "weekend_unavailable").length,
      capabilityBadges: [],
    },
  ];
  const availableCount = new Set(
    data.availabilitySlots
      .filter((slot) => slot.slot_kind === "full_day" || slot.slot_kind === "partial_day" || slot.slot_kind === "night_cover")
      .map((slot) => slot.profile_id),
  ).size;
  const unavailableCount = new Set(
    data.availabilitySlots
      .filter((slot) => slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable")
      .map((slot) => slot.profile_id),
  ).size;
  const nightCoverCount = data.availabilitySlots.filter((slot) => slot.slot_kind === "night_cover").length;
  const weekendUnavailableCount = data.availabilitySlots.filter((slot) => slot.slot_kind === "weekend_unavailable").length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Availability"
          title="Station availability"
          summary="Station admins and LOMs can review crew availability, weeknight cover, and weekend unavailability by station."
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
          title="Availability summary"
          description="Availability shows who has declared they are available or unavailable. It does not itself mean the asset is on service; readiness combines availability, roles, qualifications, and safe-crewing rules."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <DashboardSummaryTile
              label="Available crew"
              value={availableCount}
              tone="green"
              description="Active available windows"
            />
            <DashboardSummaryTile
              label="Unavailable crew"
              value={unavailableCount}
              tone={unavailableCount > 0 ? "amber" : "grey"}
              description="Active unavailable windows"
            />
            <DashboardSummaryTile
              label="Night cover"
              value={nightCoverCount}
              tone="blue"
              description="Mon to Thu 19:00–07:00"
            />
            <DashboardSummaryTile
              label="Weekend unavailable"
              value={weekendUnavailableCount}
              tone={weekendUnavailableCount > 0 ? "red" : "grey"}
              description="Fri 19:00 to Mon 07:00"
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Current assessment time: {nowLabel}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/admin/readiness"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              View readiness
            </Link>
            <Link
              href="/admin/duty-rota"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              View duty rota
            </Link>
          </div>
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
              title="Add station availability"
              description="Station-scoped entries can include crew members, locations, assets, and roles."
            >
              <form
                action={saveStationAvailabilityAction}
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
                  <span className="text-sm font-medium text-card-foreground">Availability type</span>
                  <select
                    name="slot_kind"
                    defaultValue="full_day"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="full_day">Full day</option>
                    <option value="partial_day">Partial day</option>
                    <option value="night_cover">Night cover</option>
                    <option value="unavailable">Unavailable</option>
                    <option value="weekend_unavailable">Weekend unavailable</option>
                  </select>
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
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Notes</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                    placeholder="Optional note for station availability"
                  />
                </label>
                <div className="md:col-span-2 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-3 text-sm text-card-foreground">
                    <input
                      type="checkbox"
                      name="is_recurring"
                      className="h-4 w-4 rounded border-white/20 bg-transparent"
                    />
                    Recurring
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
                </div>
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
                    Save station availability
                  </button>
                </div>
              </form>
            </SectionShell>

            <SectionShell
              title="Location dashboard"
              description="Station locations appear first so you can expand the place you need and keep the raw rows collapsed by default."
            >
              {groupedLocations.length ? (
                <div className="space-y-4">
                  {groupedLocations.map((group) => (
                    <details key={group.key} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                      <summary className="cursor-pointer list-none outline-none">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-card-foreground">{group.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {group.availableCount} available · {group.unavailableCount} unavailable · {group.nightCoverCount} night cover · {group.weekendUnavailableCount} weekend unavailable
                            </p>
                          </div>
                          <StatusPill tone={group.tone}>
                            {group.availableCount > 0 ? "Ready" : group.unavailableCount > 0 ? "At risk" : "Unknown"}
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

                        {group.slots.length ? (
                          <div className="space-y-3">
                            {group.slots.map((slot) => {
                              const profile = slot.profile && !Array.isArray(slot.profile) ? slot.profile : null;
                              const asset = slot.asset && !Array.isArray(slot.asset) ? slot.asset : null;
                              const assetType = slot.asset_type && !Array.isArray(slot.asset_type) ? slot.asset_type : null;
                              const role = slot.operational_role && !Array.isArray(slot.operational_role) ? slot.operational_role : null;

                              return (
                                <details key={slot.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                  <summary className="cursor-pointer list-none outline-none">
                                    <div className="flex items-start justify-between gap-3">
                                      <div>
                                        <p className="text-sm font-medium text-card-foreground">
                                          {profile?.display_name ?? profile?.email ?? "Crew member"} · {getAvailabilitySummary(slot.slot_kind).toLowerCase()}
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {formatDateTime(slot.starts_at)} to {formatDateTime(slot.ends_at)}
                                        </p>
                                      </div>
                                      <StatusPill tone={getSlotTone(slot)}>{slot.is_active ? "Active" : "Inactive"}</StatusPill>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                      {asset ? <span className="rounded-full border border-white/10 px-3 py-1">{asset.name}</span> : null}
                                      {assetType ? <span className="rounded-full border border-white/10 px-3 py-1">{assetType.name}</span> : null}
                                      {role ? <span className="rounded-full border border-white/10 px-3 py-1">{role.name}</span> : null}
                                    </div>
                                  </summary>

                                  {slot.notes ? (
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{slot.notes}</p>
                                  ) : null}
                                </details>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-muted-foreground">
                            No availability windows exist for this location yet.
                          </div>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No station availability windows exist yet.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Crew capability badges"
              description="Shared badge formatter for asset-specific roles."
            >
              {capabilityBadges.length ? (
                <CrewCapabilityBadges items={capabilityBadges} />
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  Add crew roles to surface capability badges here.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell title="No station selected" description="Choose a station to load station availability.">
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to review or create availability windows.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
