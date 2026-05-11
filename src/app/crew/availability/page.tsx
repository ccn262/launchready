import { AppShell } from "@/components/app-shell";
import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { DashboardSummaryTile } from "@/components/dashboard-summary-tile";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import Link from "next/link";
import { saveCrewAvailabilityAction } from "@/app/phase6-actions";
import { buildRedirectUrl, type AssetRecord, type AssetTypeRecord, type StationLocationRecord } from "@/lib/admin-crud";
import { buildCapabilityBadges } from "@/lib/capability-badges";
import { type OperationalRoleRecord } from "@/lib/admin-phase5";
import {
  getNextWeekendWindow,
  loadCrewAvailabilityContext,
  type AvailabilitySlotRecord,
} from "@/lib/phase6";

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

function isAvailableSlot(slot: AvailabilitySlotRecord) {
  return slot.slot_kind === "full_day" || slot.slot_kind === "partial_day" || slot.slot_kind === "night_cover";
}

function isUnavailableSlot(slot: AvailabilitySlotRecord) {
  return slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable";
}

function SlotCard({
  slot,
  locations,
  assets,
  assetTypes,
  operationalRoles,
  returnPath,
}: Readonly<{
  slot: AvailabilitySlotRecord;
  locations: StationLocationRecord[];
  assets: AssetRecord[];
  assetTypes: AssetTypeRecord[];
  operationalRoles: OperationalRoleRecord[];
  returnPath: string;
}>) {
  const location = slot.station_location && !Array.isArray(slot.station_location) ? slot.station_location : null;
  const asset = slot.asset && !Array.isArray(slot.asset) ? slot.asset : null;
  const assetType = slot.asset_type && !Array.isArray(slot.asset_type) ? slot.asset_type : null;
  const role = slot.operational_role && !Array.isArray(slot.operational_role) ? slot.operational_role : null;

  return (
    <form
      action={saveCrewAvailabilityAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="slot_id" value={slot.id} />
      <input type="hidden" name="station_id" value={slot.station_id} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {slot.slot_kind.replace(/_/g, " ")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(slot.starts_at)} to {formatDateTime(slot.ends_at)}
          </p>
        </div>
        <StatusPill tone={getSlotTone(slot)}>{slot.is_active ? "Active" : "Inactive"}</StatusPill>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {location ? <span className="rounded-full border border-white/10 px-3 py-1">{location.name}</span> : null}
        {asset ? <span className="rounded-full border border-white/10 px-3 py-1">{asset.name}</span> : null}
        {assetType ? <span className="rounded-full border border-white/10 px-3 py-1">{assetType.name}</span> : null}
        {role ? <span className="rounded-full border border-white/10 px-3 py-1">{role.name}</span> : null}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Availability type</span>
          <select
            name="slot_kind"
            defaultValue={slot.slot_kind}
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
          <span className="text-sm font-medium text-card-foreground">Station location</span>
          <select
            name="station_location_id"
            defaultValue={slot.station_location_id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
          >
            <option value="">No location</option>
            {locations.map((location) => (
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
            defaultValue={slot.asset_type_id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
          >
            <option value="">No asset type</option>
            {assetTypes.map((assetType) => (
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
            defaultValue={slot.asset_id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
          >
            <option value="">No asset</option>
            {assets.map((asset) => {
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
            defaultValue={slot.operational_role_id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
          >
            <option value="">No role</option>
            {operationalRoles.map((role) => (
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
            defaultValue={slot.starts_at ? toDateTimeLocalValue(new Date(slot.starts_at)) : ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Ends at</span>
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={slot.ends_at ? toDateTimeLocalValue(new Date(slot.ends_at)) : ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={slot.notes ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
        />
      </label>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm text-card-foreground">
          <input
            type="checkbox"
            name="is_recurring"
            defaultChecked={slot.is_recurring}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Recurring
        </label>
        <label className="flex items-center gap-3 text-sm text-card-foreground">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={slot.is_active}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Active
        </label>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="reset"
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
        >
          Save
        </button>
      </div>
    </form>
  );
}

export default async function CrewAvailabilityPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadCrewAvailabilityContext("/crew/availability", requestedStationId);
  const returnPath = buildRedirectUrl("/crew/availability", { stationId: data.selectedStationId });
  const weekendWindow = getNextWeekendWindow();
  const capabilityBadges = buildCapabilityBadges(
    data.crewQualifications.filter((qualification) => qualification.asset_id && qualification.operational_role_id),
  );
  const defaultStartDate = new Date();
  const defaultEndDate = new Date(defaultStartDate.getTime() + 8 * 60 * 60 * 1000);
  const assessmentTime = new Date();
  const assessmentTimeMs = assessmentTime.getTime();
  const defaultStart = toDateTimeLocalValue(defaultStartDate);
  const defaultEnd = toDateTimeLocalValue(defaultEndDate);
  const availableNowCount = data.availabilitySlots.filter((slot) => slot.is_active && isAvailableSlot(slot)).length;
  const upcomingAvailabilityCount = data.availabilitySlots.filter(
    (slot) => slot.is_active && isAvailableSlot(slot) && slot.starts_at && new Date(slot.starts_at).getTime() > assessmentTimeMs,
  ).length;
  const unavailableCount = data.availabilitySlots.filter((slot) => slot.is_active && isUnavailableSlot(slot)).length;
  const weekendUnavailableCount = data.availabilitySlots.filter(
    (slot) => slot.is_active && slot.slot_kind === "weekend_unavailable",
  ).length;
  const availableSlots = data.availabilitySlots.filter((slot) => slot.is_active && isAvailableSlot(slot));
  const upcomingSlots = availableSlots.filter((slot) => slot.starts_at && new Date(slot.starts_at).getTime() > assessmentTimeMs);
  const unavailableSlots = data.availabilitySlots.filter((slot) => slot.is_active && slot.slot_kind === "unavailable");
  const weekendUnavailableSlots = data.availabilitySlots.filter((slot) => slot.is_active && slot.slot_kind === "weekend_unavailable");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Crew / Availability"
          title="Availability calendar"
          summary="Crew can record full-day, partial-day, night cover, and weekend unavailability windows."
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
          description="Tell the station when you can or cannot cover. Availability does not itself mean the asset is on service; readiness combines availability, roles, qualifications, and safe-crewing rules."
        >
          <div className="grid gap-4 md:grid-cols-4">
            <DashboardSummaryTile label="Available now" value={availableNowCount} tone="green" />
            <DashboardSummaryTile label="Upcoming availability" value={upcomingAvailabilityCount} tone="blue" />
            <DashboardSummaryTile label="Unavailable periods" value={unavailableCount} tone="amber" />
            <DashboardSummaryTile label="Weekend unavailable" value={weekendUnavailableCount} tone="red" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="#add-availability"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Add availability
            </Link>
            <Link
              href="/crew/rota"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              View rota
            </Link>
          </div>
        </SectionShell>

        <SectionShell
          title="Station context"
          description="Select the station whose availability you want to manage."
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
              title="Add availability"
              description="Use a datetime window, then tag it with location, asset, and role context where helpful."
            >
              <form
                id="add-availability"
                action={saveCrewAvailabilityAction}
                className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
              >
                <input type="hidden" name="station_id" value={data.selectedStationId} />
                <input type="hidden" name="return_path" value={returnPath} />
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
                  <span className="text-sm font-medium text-card-foreground">Station location</span>
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
                    placeholder="Optional note for crew availability"
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
                    Save availability
                  </button>
                </div>
              </form>
            </SectionShell>

            <SectionShell
              title="Availability breakdown"
              description="Grouped by how crew have declared their availability so the station can scan the current picture quickly."
            >
              <div className="space-y-4">
                {[
                  ["Available now", availableSlots],
                  ["Upcoming availability", upcomingSlots],
                  ["Unavailable periods", unavailableSlots],
                  ["Weekend unavailable", weekendUnavailableSlots],
                ].map(([label, slots]) => (
                  <details key={label as string} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                    <summary className="cursor-pointer list-none outline-none">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-card-foreground">{label as string}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{(slots as AvailabilitySlotRecord[]).length} records</p>
                        </div>
                        <StatusPill tone={(slots as AvailabilitySlotRecord[]).length ? (label === "Weekend unavailable" ? "red" : label === "Unavailable periods" ? "amber" : label === "Upcoming availability" ? "blue" : "green") : "grey"}>
                          { (slots as AvailabilitySlotRecord[]).length ? "Shown" : "None" }
                        </StatusPill>
                      </div>
                    </summary>
                    <div className="mt-4 space-y-4">
                      {(slots as AvailabilitySlotRecord[]).length ? (
                        (slots as AvailabilitySlotRecord[]).map((slot) => (
                          <SlotCard
                            key={slot.id}
                            slot={slot}
                            locations={data.locations}
                            assets={data.assets}
                            assetTypes={data.assetTypes}
                            operationalRoles={data.operationalRoles}
                            returnPath={returnPath}
                          />
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-muted-foreground">
                          No records in this section.
                        </div>
                      )}
                    </div>
                  </details>
                ))}
              </div>
            </SectionShell>

            <SectionShell
              title="Crew capability badges"
              description="Reusable badge formatting for asset-specific roles."
            >
              {capabilityBadges.length ? (
                <CrewCapabilityBadges items={capabilityBadges} />
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  Add asset-specific role qualifications to show capability badges here.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Weekend duty window"
              description="Weekend rota foundation without auto-generation."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <StatusPill tone="blue">Friday 19:00</StatusPill>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Weekend duty starts at {weekendWindow.startDateTimeLocal.replace("T", " ")}.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <StatusPill tone="amber">Monday 07:00</StatusPill>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Weekend duty ends at {weekendWindow.endDateTimeLocal.replace("T", " ")}.
                  </p>
                </div>
              </div>
            </SectionShell>
          </>
        ) : (
          <SectionShell title="No station selected" description="Choose a station to load availability records.">
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to view or create availability windows.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
