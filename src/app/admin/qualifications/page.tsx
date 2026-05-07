import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { saveQualificationAction } from "@/app/admin/phase5-actions";
import { buildRedirectUrl } from "@/lib/admin-crud";
import {
  loadCrewPageData,
  type QualificationTypeRecord,
  type CrewQualificationRecord,
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

function getQualificationTone(record: CrewQualificationRecord) {
  if (!record.is_active) {
    return "red" as const;
  }

  if (record.expires_on) {
    const expires = new Date(record.expires_on);
    const diffDays = Math.ceil((expires.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return "red" as const;
    }

    if (diffDays <= 30) {
      return "amber" as const;
    }
  }

  return "green" as const;
}

function QualificationCard({
  qualification,
  qualificationTypes,
  returnPath,
}: Readonly<{
  qualification: CrewQualificationRecord;
  qualificationTypes: QualificationTypeRecord[];
  returnPath: string;
}>) {
  const profile = qualification.profile && !Array.isArray(qualification.profile) ? qualification.profile : null;
  const type = qualification.qualification_type && !Array.isArray(qualification.qualification_type)
    ? qualification.qualification_type
    : null;

  return (
    <form
      action={saveQualificationAction}
      className="rounded-3xl border border-white/10 bg-slate-950/50 p-4"
    >
      <input type="hidden" name="qualification_id" value={qualification.id} />
      <input type="hidden" name="station_id" value={qualification.station_id} />
      <input type="hidden" name="profile_id" value={qualification.profile_id} />
      <input type="hidden" name="return_path" value={returnPath} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {profile?.display_name ?? "Unnamed profile"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {type?.name ?? "Qualification"} · expires{" "}
            {qualification.expires_on ?? "n/a"}
          </p>
        </div>
        <StatusPill tone={getQualificationTone(qualification)}>
          {qualification.currency_state.toUpperCase()}
        </StatusPill>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Crew member
          </span>
          <input
            value={profile?.display_name ?? qualification.profile_id}
            readOnly
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 text-sm text-muted-foreground outline-none"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Qualification type
          </span>
          <select
            name="qualification_type_id"
            defaultValue={qualification.qualification_type_id ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            {qualificationTypes.map((qualificationType) => (
              <option key={qualificationType.id} value={qualificationType.id}>
                {qualificationType.name}
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
            defaultValue={qualification.currency_state}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          >
            <option value="green">Green</option>
            <option value="amber">Amber</option>
            <option value="red">Red</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Starts on
          </span>
          <input
            type="date"
            name="starts_on"
            defaultValue={qualification.starts_on}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-card-foreground">
            Expires on
          </span>
          <input
            type="date"
            name="expires_on"
            defaultValue={qualification.expires_on ?? ""}
            className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
          />
        </label>
      </div>

      <label className="mt-4 block space-y-2">
        <span className="text-sm font-medium text-card-foreground">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={qualification.notes ?? ""}
          className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none transition"
          placeholder="Optional notes"
        />
      </label>

      <label className="mt-4 flex items-center gap-3 text-sm text-card-foreground">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={qualification.is_active}
          className="h-4 w-4 rounded border-white/20 bg-transparent"
        />
        Active
      </label>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          {qualification.expires_on ? (
            <span>Expiry tracked for casualty care review.</span>
          ) : (
            <span>No expiry set.</span>
          )}
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

export default async function AdminQualificationsPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadCrewPageData("/admin/qualifications", requestedStationId);
  const qualifications = data.crewQualifications.filter((row) => row.qualification_type_id);
  const returnPath = buildRedirectUrl("/admin/qualifications", { stationId: data.selectedStationId });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Qualifications"
          title="Qualifications"
          summary="Track casualty care and other crew qualifications with clear expiry and currency states."
        />

        <FlashMessage success={success} error={error} />

        <SectionShell
          title="Station context"
          description="Choose the station whose qualifications you want to manage."
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
              title="Add qualification"
              description="Track casualty care or other qualification states, with expiry if required."
            >
              {data.memberships.length && data.qualificationTypes.length ? (
                <form
                  action={saveQualificationAction}
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
                      Qualification type
                    </span>
                    <select
                      name="qualification_type_id"
                      defaultValue={data.qualificationTypes[0]?.id ?? ""}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    >
                      {data.qualificationTypes.map((qualificationType) => (
                        <option key={qualificationType.id} value={qualificationType.id}>
                          {qualificationType.name}
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
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Starts on
                    </span>
                    <input
                      type="date"
                      name="starts_on"
                      defaultValue={new Date().toISOString().slice(0, 10)}
                      className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-card-foreground">
                      Expires on
                    </span>
                    <input
                      type="date"
                      name="expires_on"
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
                      placeholder="Optional notes"
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
                      Add qualification
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  Add crew memberships and qualification types before creating qualifications.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Qualification list"
              description="Expired or near-expiry qualifications are shown clearly for operational review."
            >
              {qualifications.length ? (
                <div className="space-y-4">
                  {qualifications.map((qualification) => (
                    <QualificationCard
                      key={qualification.id}
                      qualification={qualification}
                      qualificationTypes={data.qualificationTypes}
                      returnPath={returnPath}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No qualifications exist for this station yet.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell
            title="No station selected"
            description="Choose a station to load qualification records."
          >
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to view or create qualifications.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
