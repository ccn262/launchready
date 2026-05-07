import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import {
  buildRedirectUrl,
  getAdminAccessContext,
  loadStationLocations,
  resolveSelectedStationContext,
  type StationLocationRecord,
} from "@/lib/admin-crud";
import { saveLocationAction } from "@/app/admin/actions";

function getQueryValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

function FlashMessage({
  success,
  error,
}: Readonly<{ success: string; error: string }>) {
  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
        {success}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
        {error}
      </div>
    );
  }

  return null;
}

function LocationCard({
  location,
  stationId,
  returnPath,
}: Readonly<{
  location: StationLocationRecord;
  stationId: string;
  returnPath: string;
}>) {
  return (
    <form
      action={saveLocationAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="location_id" value={location.id} />
      <input type="hidden" name="station_id" value={stationId} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {location.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {location.slug}
          </p>
        </div>
        <StatusPill tone={location.is_active ? "green" : "red"}>
          {location.is_active ? "Active" : "Inactive"}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Name</span>
          <input
            name="name"
            defaultValue={location.name}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Sort order
          </span>
          <input
            type="number"
            name="sort_order"
            min={0}
            defaultValue={location.sort_order}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={location.notes ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
          placeholder="Optional operational notes"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-card-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={location.is_active}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Active
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Station:{" "}
          <span className="font-medium text-card-foreground">
            {location.station && !Array.isArray(location.station)
              ? location.station.name
              : "Selected station"}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
    </form>
  );
}

export default async function AdminLocationsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const { context } = await getAdminAccessContext("/admin/locations");
  const stationContext = await resolveSelectedStationContext(context, requestedStationId);
  const selectedStationId = stationContext.selectedStationId;
  const locations = selectedStationId ? await loadStationLocations(selectedStationId) : [];
  const nextSortOrder = locations.length ? Math.max(...locations.map((location) => location.sort_order)) + 1 : 1;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Locations"
          title="Locations"
          summary="Manage inshore and offshore station locations, with notes and active state controlled per station."
        />

        <FlashMessage success={success} error={error} />

        <SectionShell
          title="Station context"
          description="Choose the station you want to manage before editing locations."
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="blue">
              {stationContext.selectedStation?.name ?? "No station selected"}
            </StatusPill>
            <span className="text-sm text-muted-foreground">
              {stationContext.selectedStation?.organisation_name ?? "Station-scoped"}
            </span>
          </div>

          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 space-y-2">
              <span className="text-sm font-medium text-card-foreground">
                Station
              </span>
              <select
                name="stationId"
                defaultValue={selectedStationId ?? ""}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
              >
                <option value="">Select station</option>
                {stationContext.stationOptions.map((station) => (
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

        {selectedStationId ? (
          <>
            <SectionShell
              title="Create location"
              description="Locations are station scoped and can carry notes for operational use."
            >
              <form
                action={saveLocationAction}
                className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
              >
                <input
                  type="hidden"
                  name="return_path"
                  value={buildRedirectUrl("/admin/locations", { stationId: selectedStationId })}
                />
                <input type="hidden" name="station_id" value={selectedStationId} />
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">
                    Location name
                  </span>
                  <input
                    name="name"
                    required
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    placeholder="Inshore Station"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">
                    Sort order
                  </span>
                  <input
                    type="number"
                    name="sort_order"
                    min={0}
                    defaultValue={nextSortOrder}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                  />
                </label>
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm font-medium text-card-foreground">
                    Notes
                  </span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
                    placeholder="Optional operational notes"
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
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="reset"
                      className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
                    >
                      Create location
                    </button>
                  </div>
                </div>
              </form>
            </SectionShell>

            <SectionShell
              title="Location list"
              description="Edit location names, notes, and active state inline."
            >
              {locations.length ? (
                <div className="space-y-4">
                  {locations.map((location) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      stationId={selectedStationId}
                      returnPath={buildRedirectUrl("/admin/locations", { stationId: selectedStationId })}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No locations exist for this station yet.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell
            title="No station selected"
            description="Choose a station to load its locations."
          >
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to view or create locations.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
