import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { saveOperationalRoleAction, saveRoleAssignmentAction } from "@/app/admin/phase5-actions";
import { buildRedirectUrl } from "@/lib/admin-crud";
import {
  loadCrewPageData,
  type OperationalRoleRecord,
} from "@/lib/admin-phase5";

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

function RoleReferenceCard({
  role,
  canEdit,
  returnPath,
}: Readonly<{
  role: OperationalRoleRecord;
  canEdit: boolean;
  returnPath: string;
}>) {
  return (
    <form
      action={saveOperationalRoleAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="operational_role_id" value={role.id} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {role.name}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono">{role.code}</span> · {role.category}
          </p>
        </div>
        <StatusPill tone={role.is_active ? "green" : "red"}>
          {role.is_active ? "Active" : "Inactive"}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Code</span>
          <input
            name="code"
            defaultValue={role.code}
            disabled={!canEdit}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Name</span>
          <input
            name="name"
            defaultValue={role.name}
            disabled={!canEdit}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Description</span>
        <textarea
          name="description"
          rows={3}
          defaultValue={role.description ?? ""}
          disabled={!canEdit}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-card-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={role.is_active}
          disabled={!canEdit}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Active
      </label>

      <div className="mt-4 flex items-center justify-end gap-2">
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
    </form>
  );
}

function AssignmentCard({
  assignment,
  memberships,
  assets,
  operationalRoles,
  returnPath,
}: Readonly<{
  assignment: {
    id: string;
    station_id: string;
    profile_id: string;
    asset_id: string | null;
    operational_role_id: string | null;
    currency_state: "green" | "amber" | "red";
    notes: string | null;
    is_active: boolean;
    profile: { display_name: string | null; email: string | null } | null;
  };
  memberships: {
    profile_id: string;
    profile: { display_name: string | null; email: string | null } | null;
  }[];
  assets: {
    id: string;
    name: string;
    station_location:
      | { name: string }
      | { name: string }[]
      | null;
  }[];
  operationalRoles: OperationalRoleRecord[];
  returnPath: string;
}>) {
  const currentAsset = assets.find((asset) => asset.id === assignment.asset_id) ?? assets[0] ?? null;
  const currentRole = operationalRoles.find((role) => role.id === assignment.operational_role_id) ?? operationalRoles[0] ?? null;

  return (
    <form
      action={saveRoleAssignmentAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="assignment_id" value={assignment.id} />
      <input type="hidden" name="station_id" value={assignment.station_id} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {assignment.profile?.display_name ?? "Unnamed profile"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentAsset?.name ?? "No asset"} · {currentAsset?.station_location && !Array.isArray(currentAsset.station_location) ? currentAsset.station_location.name : "No location"}
          </p>
        </div>
        <StatusPill tone={assignment.currency_state}>
          {assignment.currency_state.toUpperCase()}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Crew member
          </span>
          <select
            name="profile_id"
            defaultValue={assignment.profile_id}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            {memberships.map((membership) => {
              const profile = membership.profile;

              return (
                <option key={membership.profile_id} value={membership.profile_id}>
                  {profile?.display_name ?? profile?.email ?? membership.profile_id}
                </option>
              );
            })}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">Asset</span>
          <select
            name="asset_id"
            defaultValue={assignment.asset_id ?? currentAsset?.id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="">Select asset</option>
            {assets.map((asset) => {
              const location =
                asset.station_location && !Array.isArray(asset.station_location)
                  ? asset.station_location
                  : null;

              return (
                <option key={asset.id} value={asset.id}>
                  {asset.name} · {location?.name ?? "No location"}
                </option>
              );
            })}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Operational role
          </span>
          <select
            name="operational_role_id"
            defaultValue={assignment.operational_role_id ?? currentRole?.id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="">Select role</option>
            {operationalRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Currency
          </span>
          <select
            name="currency_state"
            defaultValue={assignment.currency_state}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="green">Green</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
          </select>
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={assignment.notes ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
          placeholder="Optional operational notes"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-card-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={assignment.is_active}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Active
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {assignment.profile?.email ?? assignment.profile_id}
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

export default async function AdminRolesPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadCrewPageData("/admin/roles", requestedStationId);
  const assignments = data.crewQualifications.filter((row) => row.operational_role_id);
  const returnPath = buildRedirectUrl("/admin/roles", { stationId: data.selectedStationId });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Roles"
          title="Roles"
          summary="Manage operational roles and assign a role and currency state to a crew member on a specific asset."
        />

        <FlashMessage success={success} error={error} />

        <SectionShell
          title="Station context"
          description="Pick the station whose crew roles you want to manage."
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="blue">
              {data.selectedStation?.name ?? "No station selected"}
            </StatusPill>
            <span className="text-sm text-muted-foreground">
              {data.selectedStation?.organisation_name ?? "Station-scoped"}
            </span>
          </div>
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
            <label className="min-w-64 flex-1 space-y-2">
              <span className="text-sm font-medium text-card-foreground">
                Station
              </span>
              <select
                name="stationId"
                defaultValue={data.selectedStationId ?? ""}
                className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
              >
                <option value="">Select station</option>
                {data.stations.map((station) => (
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
              title="Operational role reference"
              description="Super admins can maintain the shared operational role list."
            >
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone={data.context.isSuperAdmin ? "blue" : "green"}>
                  {data.context.isSuperAdmin ? "Super admin editor" : "Read only"}
                </StatusPill>
                <span className="text-sm text-muted-foreground">
                  {data.operationalRoles.length} role
                  {data.operationalRoles.length === 1 ? "" : "s"}
                </span>
              </div>
              {data.context.isSuperAdmin ? (
                <form
                  action={saveOperationalRoleAction}
                  className="mt-4 grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
                >
                  <input type="hidden" name="return_path" value={returnPath} />
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Code
                    </span>
                    <input
                      name="code"
                      required
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                      placeholder="helm"
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
                      placeholder="Helm"
                    />
                  </label>
                  <label className="md:col-span-2 space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Description
                    </span>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
                      placeholder="Operational role description"
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
                  <div className="md:col-span-2 flex items-center gap-2">
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
                      Create operational role
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="mt-4 space-y-4">
                {data.operationalRoles.length ? (
                  data.operationalRoles.map((role) => (
                    <RoleReferenceCard
                      key={role.id}
                      role={role}
                      canEdit={data.context.isSuperAdmin}
                      returnPath={returnPath}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                    No operational roles exist yet.
                  </div>
                )}
              </div>
            </SectionShell>

            <SectionShell
              title="Asset-specific role assignments"
              description="Assign a role and currency state to a crew member on a specific asset."
            >
              {data.memberships.length && data.assets.length ? (
                <form
                  action={saveRoleAssignmentAction}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
                >
                  <input type="hidden" name="station_id" value={data.selectedStationId} />
                  <input type="hidden" name="return_path" value={returnPath} />
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Crew member
                    </span>
                    <select
                      name="profile_id"
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
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
                    <span className="text-sm font-medium text-card-foreground">
                      Asset
                    </span>
                    <select
                      name="asset_id"
                      defaultValue={data.assets[0]?.id ?? ""}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
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
                    <span className="text-sm font-medium text-card-foreground">
                      Operational role
                    </span>
                    <select
                      name="operational_role_id"
                      defaultValue={data.operationalRoles[0]?.id ?? ""}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      {data.operationalRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Currency
                    </span>
                    <select
                      name="currency_state"
                      defaultValue="green"
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      <option value="green">Green</option>
                      <option value="amber">Amber</option>
                      <option value="red">Red</option>
                    </select>
                  </label>
                  <label className="md:col-span-2 space-y-2">
                    <span className="text-sm font-medium text-card-foreground">Notes</span>
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
                  <div className="md:col-span-2 flex items-center gap-2">
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
                      Add assignment
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  Add crew memberships and assets before creating role assignments.
                </div>
              )}

              <div className="mt-4 space-y-4">
                {assignments.length ? (
                  assignments.map((assignment) => (
                    <AssignmentCard
                      key={assignment.id}
                      assignment={{
                        id: assignment.id,
                        station_id: assignment.station_id,
                        profile_id: assignment.profile_id,
                        asset_id: assignment.asset_id,
                        operational_role_id: assignment.operational_role_id,
                        currency_state: assignment.currency_state,
                        notes: assignment.notes,
                        is_active: assignment.is_active,
                        profile:
                          assignment.profile && !Array.isArray(assignment.profile)
                            ? {
                                display_name: assignment.profile.display_name,
                                email: assignment.profile.email,
                              }
                            : null,
                      }}
                      memberships={data.memberships.map((membership) => ({
                        profile_id: membership.profile_id,
                        profile:
                          membership.profile && !Array.isArray(membership.profile)
                            ? {
                                display_name: membership.profile.display_name,
                                email: membership.profile.email,
                              }
                            : null,
                      }))}
                      assets={data.assets.map((asset) => ({
                        id: asset.id,
                        name: asset.name,
                        station_location: asset.station_location,
                      }))}
                      operationalRoles={data.operationalRoles}
                      returnPath={returnPath}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                    No role assignments exist yet for this station.
                  </div>
                )}
              </div>
            </SectionShell>
          </>
        ) : (
          <SectionShell
            title="No station selected"
            description="Choose a station to load role assignment data."
          >
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to view or create role assignments.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
