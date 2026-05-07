import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import {
  getAdminAccessContext,
  loadAssetTypes,
  type AssetTypeRecord,
} from "@/lib/admin-crud";
import { saveAssetTypeAction } from "@/app/admin/actions";

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

function AssetTypeCard({
  assetType,
  canEdit,
  returnPath,
}: Readonly<{
  assetType: AssetTypeRecord;
  canEdit: boolean;
  returnPath: string;
}>) {
  return (
    <form
      action={saveAssetTypeAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="asset_type_id" value={assetType.id} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {assetType.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{assetType.code}</span> · {assetType.category}
          </p>
        </div>
        <StatusPill tone={assetType.is_active ? "green" : "red"}>
          {assetType.is_active ? "Active" : "Inactive"}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Code</span>
          <input
            name="code"
            defaultValue={assetType.code}
            disabled={!canEdit}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Name</span>
          <input
            name="name"
            defaultValue={assetType.name}
            disabled={!canEdit}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Category
          </span>
          <select
            name="category"
            defaultValue={assetType.category}
            disabled={!canEdit}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="lifeboat">Lifeboat</option>
            <option value="launch_recovery">Launch / recovery</option>
            <option value="vehicle">Vehicle</option>
            <option value="equipment">Equipment</option>
            <option value="support">Support</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Recovery equipment
          </span>
          <select
            name="requires_recovery_equipment"
            defaultValue={assetType.requires_recovery_equipment ? "true" : "false"}
            disabled={!canEdit}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">
          Description
        </span>
        <textarea
          name="description"
          rows={3}
          defaultValue={assetType.description ?? ""}
          disabled={!canEdit}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-card-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={assetType.is_active}
          disabled={!canEdit}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Active
      </label>

      <div className="mt-4 flex justify-end">
        <div className="flex items-center gap-2">
          <button
            type="reset"
            disabled={!canEdit}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canEdit}
            className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-muted-foreground"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}

export default async function AdminAssetTypesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const { context } = await getAdminAccessContext("/admin/asset-types");
  const assetTypes = await loadAssetTypes();

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Asset types"
          title="Asset types"
          summary="Global reference data for lifeboats and launch / recovery equipment. Only super admins can create or edit this reference set."
        />

        <FlashMessage success={success} error={error} />

        <SectionShell
          title="Reference data"
          description="Asset types are shared across stations and stay read-only for station admins."
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone={context.isSuperAdmin ? "blue" : "green"}>
              {context.isSuperAdmin ? "Super admin editor" : "Read only"}
            </StatusPill>
            <span className="text-sm text-muted-foreground">
              {assetTypes.length} type{assetTypes.length === 1 ? "" : "s"}
            </span>
          </div>
        </SectionShell>

        {context.isSuperAdmin ? (
          <SectionShell
            title="Create asset type"
            description="Add new global reference types for stations and assets."
          >
            <form
              action={saveAssetTypeAction}
              className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
            >
              <input type="hidden" name="return_path" value="/admin/asset-types" />
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">
                  Code
                </span>
                <input
                  name="code"
                  required
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                  placeholder="d-class-lifeboat"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">
                  Name
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
                  Category
                </span>
                <select
                  name="category"
                  defaultValue="lifeboat"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                >
                  <option value="lifeboat">Lifeboat</option>
                  <option value="launch_recovery">Launch / recovery</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="equipment">Equipment</option>
                  <option value="support">Support</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-card-foreground">
                  Recovery equipment
                </span>
                <select
                  name="requires_recovery_equipment"
                  defaultValue="false"
                  className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </label>
              <label className="md:col-span-2 space-y-2">
                <span className="text-sm font-medium text-card-foreground">
                  Description
                </span>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
                  placeholder="Optional reference description"
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
                    Create asset type
                  </button>
                </div>
              </div>
            </form>
          </SectionShell>
        ) : null}

        <SectionShell
          title="Asset type list"
          description="Use the cards below to review and update the global reference set."
        >
          {assetTypes.length ? (
            <div className="space-y-4">
              {assetTypes.map((assetType) => (
                <AssetTypeCard
                  key={assetType.id}
                  assetType={assetType}
                  canEdit={context.isSuperAdmin}
                  returnPath="/admin/asset-types"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              No asset types exist yet.
            </div>
          )}
        </SectionShell>
      </div>
    </AppShell>
  );
}
