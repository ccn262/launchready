import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { saveMembershipAction } from "@/app/admin/phase5-actions";
import {
  buildRedirectUrl,
  type StationOption,
} from "@/lib/admin-crud";
import {
  loadCrewPageData,
  type CrewTypeRecord,
  type StationMembershipRecord,
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

function MembershipCard({
  membership,
  crewTypes,
  returnPath,
}: Readonly<{
  membership: StationMembershipRecord;
  crewTypes: CrewTypeRecord[];
  returnPath: string;
}>) {
  const profile = membership.profile && !Array.isArray(membership.profile) ? membership.profile : null;
  const crewType = membership.crew_type && !Array.isArray(membership.crew_type) ? membership.crew_type : null;

  return (
    <form
      action={saveMembershipAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="membership_id" value={membership.id} />
      <input type="hidden" name="station_id" value={membership.station_id} />
      <input type="hidden" name="profile_id" value={membership.profile_id} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {profile?.display_name ?? "Unnamed profile"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.email ?? "No email"} · {profile?.phone ?? "No phone"}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <StatusPill tone={membership.is_active ? "green" : "red"}>
            {membership.is_active ? "Active" : "Inactive"}
          </StatusPill>
          <StatusPill tone={membership.is_primary ? "blue" : "amber"}>
            {membership.is_primary ? "Primary" : "Secondary"}
          </StatusPill>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Crew type
          </span>
          <select
            name="crew_type_id"
            defaultValue={membership.crew_type_id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="">No crew type</option>
            {crewTypes.map((crewTypeOption) => (
              <option key={crewTypeOption.id} value={crewTypeOption.id}>
                {crewTypeOption.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Membership role
          </span>
          <select
            name="membership_role"
            defaultValue={membership.membership_role}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="crew">Crew</option>
            <option value="dla">DLA</option>
            <option value="lom">LOM</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm text-card-foreground">
          <input
            type="checkbox"
            name="is_primary"
            defaultChecked={membership.is_primary}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Primary
        </label>
        <label className="flex items-center gap-3 text-sm text-card-foreground">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={membership.is_active}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Active
        </label>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Crew type: <span className="font-mono">{crewType?.code ?? "none"}</span>
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

function AddMembershipCard({
  crewTypes,
  station,
  returnPath,
}: Readonly<{
  crewTypes: CrewTypeRecord[];
  station: StationOption;
  returnPath: string;
}>) {
  return (
    <form
      action={saveMembershipAction}
      className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2"
    >
      <input type="hidden" name="station_id" value={station.id} />
      <input type="hidden" name="return_path" value={returnPath} />
      <label className="space-y-2">
        <span className="text-sm font-medium text-card-foreground">
          Existing profile email
        </span>
        <input
          name="profile_email"
          type="email"
          required
          className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          placeholder="crew@example.com"
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-card-foreground">
          Crew type
        </span>
        <select
          name="crew_type_id"
          className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
        >
          <option value="">No crew type</option>
          {crewTypes.map((crewType) => (
            <option key={crewType.id} value={crewType.id}>
              {crewType.name}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-card-foreground">
          Membership role
        </span>
        <select
          name="membership_role"
          defaultValue="crew"
          className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
        >
          <option value="crew">Crew</option>
          <option value="dla">DLA</option>
          <option value="lom">LOM</option>
          <option value="admin">Admin</option>
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3 text-sm text-card-foreground">
          <input
            type="checkbox"
            name="is_primary"
            defaultChecked
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          Primary
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
          Add membership
        </button>
      </div>
    </form>
  );
}

export default async function AdminCrewPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadCrewPageData("/admin/crew", requestedStationId);
  const returnPath = buildRedirectUrl("/admin/crew", { stationId: data.selectedStationId });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Crew"
          title="Crew"
          summary="Manage station memberships, crew type, and active status using the current station scope."
        />

        <FlashMessage success={success} error={error} />

        <SectionShell
          title="Station context"
          description="Choose the station whose crew you want to manage."
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
              title="Add existing profile"
              description="Add an already-provisioned profile to this station by email address."
            >
              <AddMembershipCard
                crewTypes={data.crewTypes}
                station={data.selectedStation as StationOption}
                returnPath={returnPath}
              />
            </SectionShell>

            <SectionShell
              title="Crew list"
              description="Display name, contact details, crew type, membership role, and active state."
            >
              {data.memberships.length ? (
                <div className="space-y-4">
                  {data.memberships.map((membership) => (
                    <MembershipCard
                      key={membership.id}
                      membership={membership}
                      crewTypes={data.crewTypes}
                      returnPath={returnPath}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No crew memberships exist for this station yet.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell
            title="No station selected"
            description="Choose a station to load or create crew memberships."
          >
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to view or create crew memberships.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
