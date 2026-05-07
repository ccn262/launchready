import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import {
  buildRedirectUrl,
  getAdminAccessContext,
  loadAssetTypes,
  loadStationAssets,
  loadStationLocations,
  resolveSelectedStationContext,
  type AssetRecord,
  type AssetTypeRecord,
  type StationLocationRecord,
} from "@/lib/admin-crud";
import { saveAssetAction } from "@/app/admin/actions";

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

function AssetCard({
  asset,
  stationId,
  locationOptions,
  assetTypeOptions,
  returnPath,
}: Readonly<{
  asset: AssetRecord;
  stationId: string;
  locationOptions: StationLocationRecord[];
  assetTypeOptions: AssetTypeRecord[];
  returnPath: string;
}>) {
  const stationLocation =
    asset.station_location && !Array.isArray(asset.station_location)
      ? asset.station_location
      : null;
  const assetType = asset.asset_type && !Array.isArray(asset.asset_type) ? asset.asset_type : null;

  return (
    <form
      action={saveAssetAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="asset_id" value={asset.id} />
      <input type="hidden" name="station_id" value={stationId} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {asset.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {asset.asset_code ?? "No code"}
          </p>
        </div>
        <StatusPill tone={asset.is_active ? "green" : "red"}>
          {asset.is_active ? "Active" : "Inactive"}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Name</span>
          <input
            name="name"
            defaultValue={asset.name}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Asset code
          </span>
          <input
            name="asset_code"
            defaultValue={asset.asset_code ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
            placeholder="SOUTHEND-D-01"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Location
          </span>
          <select
            name="station_location_id"
            defaultValue={asset.station_location_id}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            {locationOptions.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Asset type
          </span>
          <select
            name="asset_type_id"
            defaultValue={asset.asset_type_id}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            {assetTypeOptions.map((assetTypeOption) => (
              <option key={assetTypeOption.id} value={assetTypeOption.id}>
                {assetTypeOption.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Status</span>
          <select
            name="status"
            defaultValue={asset.status}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="ready">Ready</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
            <option value="maintenance">Maintenance</option>
            <option value="off_service">Off service</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Recovery support
          </span>
          <select
            name="requires_recovery_support"
            defaultValue={asset.requires_recovery_support ? "true" : "false"}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={asset.notes ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
          placeholder="Optional operational notes"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-card-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={asset.is_active}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Active
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {stationLocation?.name ?? "Location"} ·{" "}
          <span className="font-mono">{assetType?.code ?? "asset type"}</span>
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

function LocationGroup({
  location,
  assets,
  stationId,
  locationOptions,
  assetTypeOptions,
  returnPath,
}: Readonly<{
  location: StationLocationRecord;
  assets: AssetRecord[];
  stationId: string;
  locationOptions: StationLocationRecord[];
  assetTypeOptions: AssetTypeRecord[];
  returnPath: string;
}>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-card-foreground">
            {location.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            Sort order {location.sort_order}
          </p>
        </div>
        <StatusPill tone={location.is_active ? "green" : "red"}>
          {location.is_active ? "Active" : "Inactive"}
        </StatusPill>
      </div>

      {assets.length ? (
        <div className="space-y-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              stationId={stationId}
              locationOptions={locationOptions}
              assetTypeOptions={assetTypeOptions}
              returnPath={returnPath}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
          No assets yet in this location.
        </div>
      )}
    </div>
  );
}

export default async function AdminAssetsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const { context } = await getAdminAccessContext("/admin/assets");
  const stationContext = await resolveSelectedStationContext(context, requestedStationId);
  const selectedStationId = stationContext.selectedStationId;
  const stationOptions = stationContext.stationOptions;
  const assetTypes = await loadAssetTypes();
  const locations = selectedStationId ? await loadStationLocations(selectedStationId) : [];
  const assets = selectedStationId ? await loadStationAssets(selectedStationId) : [];
  const nextAssetCodeSeed = assets.length + 1;
  const returnPath = buildRedirectUrl("/admin/assets", { stationId: selectedStationId });
  const groupedAssets = locations.map((location) => ({
    location,
    assets: assets.filter((asset) => asset.station_location_id === location.id),
  }));

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Assets"
          title="Assets"
          summary="Manage station assets, lifeboats, and launch / recovery equipment by station and location."
        />

        <FlashMessage success={success} error={error} />

        <SectionShell
          title="Station context"
          description="Choose the station you want to manage before editing assets."
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
                {stationOptions.map((station) => (
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
              title="Create asset"
              description="Assets belong to one station and one location. Asset code keeps duplicate names safe across locations."
            >
              {locations.length && assetTypes.length ? (
                <form
                  action={saveAssetAction}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
                >
                  <input type="hidden" name="station_id" value={selectedStationId} />
                  <input type="hidden" name="return_path" value={returnPath} />
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Asset name
                    </span>
                    <input
                      name="name"
                      required
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                      placeholder="D Class"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Asset code
                    </span>
                    <input
                      name="asset_code"
                      required
                      defaultValue={`asset-${nextAssetCodeSeed}`}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                      placeholder="SOUTHEND-D-01"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Location
                    </span>
                    <select
                      name="station_location_id"
                      defaultValue={locations[0]?.id ?? ""}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Asset type
                    </span>
                    <select
                      name="asset_type_id"
                      defaultValue={assetTypes[0]?.id ?? ""}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      {assetTypes.map((assetType) => (
                        <option key={assetType.id} value={assetType.id}>
                          {assetType.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Status
                    </span>
                    <select
                      name="status"
                      defaultValue="ready"
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      <option value="ready">Ready</option>
                      <option value="amber">Amber</option>
                      <option value="red">Red</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="off_service">Off service</option>
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Recovery support
                    </span>
                    <select
                      name="requires_recovery_support"
                      defaultValue="false"
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
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
                  <div className="flex items-center gap-2 md:col-span-2">
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
                      Create asset
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  Create or select locations and asset types before adding assets.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Asset list"
              description="Duplicate asset names are allowed across different locations when the asset code remains unique."
            >
              {groupedAssets.length ? (
                <div className="space-y-6">
                  {groupedAssets.map(({ location, assets: locationAssets }) => (
                    <LocationGroup
                      key={location.id}
                      location={location}
                      assets={locationAssets}
                      stationId={selectedStationId}
                      locationOptions={locations}
                      assetTypeOptions={assetTypes}
                      returnPath={returnPath}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No assets exist for this station yet.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell
            title="No station selected"
            description="Choose a station to load its assets."
          >
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to view or create assets.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
