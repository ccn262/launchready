import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { saveCoverRequestAction, saveCoverResponseAction, cancelCoverRequestAction } from "@/app/cover-actions";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { loadCrewCoverPageData } from "@/lib/cover-requests";

export const dynamic = "force-dynamic";

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

function toneForStatus(status: string) {
  switch (status) {
    case "accepted":
      return "green" as const;
    case "cancelled":
    case "expired":
      return "red" as const;
    case "open":
      return "amber" as const;
    default:
      return "grey" as const;
  }
}

function toneForEligibility(status: string | null | undefined) {
  switch (status) {
    case "eligible":
      return "green" as const;
    case "needs_admin_review":
      return "amber" as const;
    case "ineligible":
      return "red" as const;
    default:
      return "grey" as const;
  }
}

function RequestCard({
  item,
  currentProfileId,
}: Readonly<{
  item: Awaited<ReturnType<typeof loadCrewCoverPageData>>["coverRequests"][number];
  currentProfileId: string | null;
}>) {
  const request = item.request;
  const isMyRequest = Boolean(currentProfileId && request.requester_profile_id === currentProfileId);
  const isOpen = request.status === "open";

  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-card-foreground">
            {item.requesterName}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.requestLabel} · {formatDateTime(request.starts_at)} to {formatDateTime(request.ends_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone={toneForStatus(request.status)}>{request.status.replace(/_/g, " ")}</StatusPill>
          <StatusPill tone={request.urgency === "urgent" ? "red" : "amber"}>
            {request.urgency}
          </StatusPill>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-white/10 px-3 py-1">
          {request.cover_type.replace(/_/g, " ")}
        </span>
        {item.assetName ? <span className="rounded-full border border-white/10 px-3 py-1">{item.assetName}</span> : null}
        {item.roleName ? <span className="rounded-full border border-white/10 px-3 py-1">{item.roleName}</span> : null}
        {item.crewTypeName ? <span className="rounded-full border border-white/10 px-3 py-1">{item.crewTypeName}</span> : null}
      </div>

      <p className="mt-4 text-sm leading-6 text-muted-foreground">
        {request.reason}
      </p>

      {request.notes ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {request.notes}
        </p>
      ) : null}

      {item.myEligibility ? (
        <div className="mt-4 flex items-center gap-2">
          <StatusPill tone={toneForEligibility(item.myEligibility.status)}>
            {item.myEligibility.status.replace(/_/g, " ")}
          </StatusPill>
          <span className="text-xs text-muted-foreground">
            {item.myEligibility.notes.join(" ")}
          </span>
        </div>
      ) : null}

      {item.responses.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Responses</p>
          <div className="flex flex-wrap gap-2">
            {item.responses.map((response) => {
              const responder = response.responder && !Array.isArray(response.responder) ? response.responder : null;
              return (
                <span
                  key={response.id}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-card-foreground"
                >
                  {responder?.display_name ?? responder?.email ?? response.responder_profile_id} · {response.response_status}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isMyRequest && isOpen ? (
          <form action={cancelCoverRequestAction}>
            <input type="hidden" name="cover_request_id" value={request.id} />
            <input type="hidden" name="return_path" value="/crew/cover" />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Cancel request
            </button>
          </form>
        ) : null}

        {!isMyRequest && isOpen && item.myEligibility?.status === "eligible" ? (
          <div className="flex flex-wrap gap-2">
            <form action={saveCoverResponseAction}>
              <input type="hidden" name="mode" value="self" />
              <input type="hidden" name="cover_request_id" value={request.id} />
              <input type="hidden" name="response_status" value="accepted" />
              <input type="hidden" name="return_path" value="/crew/cover" />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
              >
                Accept cover
              </button>
            </form>
            <form action={saveCoverResponseAction}>
              <input type="hidden" name="mode" value="self" />
              <input type="hidden" name="cover_request_id" value={request.id} />
              <input type="hidden" name="response_status" value="offered" />
              <input type="hidden" name="return_path" value="/crew/cover" />
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
              >
                Offer cover
              </button>
            </form>
          </div>
        ) : null}

        {!isMyRequest && isOpen && item.myEligibility?.status === "needs_admin_review" ? (
          <form action={saveCoverResponseAction}>
            <input type="hidden" name="mode" value="self" />
            <input type="hidden" name="cover_request_id" value={request.id} />
            <input type="hidden" name="response_status" value="offered" />
            <input type="hidden" name="return_path" value="/crew/cover" />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl bg-amber-400 px-4 text-sm font-medium text-amber-950 transition hover:bg-amber-300"
            >
              Offer for review
            </button>
          </form>
        ) : null}

        {!isMyRequest && isOpen && item.myEligibility?.status === "ineligible" ? (
          <StatusPill tone="red">Not eligible</StatusPill>
        ) : null}
      </div>
    </article>
  );
}

export default async function CrewCoverPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadCrewCoverPageData("/crew/cover", requestedStationId);
  const stationActionPath = buildRedirectUrl("/crew/cover", { stationId: data.selectedStationId });
  const myRequests = data.coverRequests.filter((item) => item.request.requester_profile_id === data.currentProfile?.id);
  const stationRequests = data.coverRequests.filter((item) => item.request.requester_profile_id !== data.currentProfile?.id);
  const activeRequests = stationRequests.filter((item) => item.request.status === "open");
  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 8 * 60 * 60 * 1000);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Crew / Cover"
          title="Cover requests"
          summary="Crew can create cover requests for weekend, day, night, or custom periods, then offer or accept like-for-like cover where eligible."
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

        {process.env.NODE_ENV !== "production" && data.debug ? (
          <SectionShell
            title="Debug snapshot"
            description="Temporary development-only request visibility check."
          >
            <div className="grid gap-3 md:grid-cols-4">
              {[
                ["selectedStationId", data.debug.selectedStationId ?? "null"],
                ["currentProfileId", data.debug.currentProfileId ?? "null"],
                ["loadedCoverRequestCount", String(data.debug.loadedCoverRequestCount)],
                ["visibleOpenRequestCount", String(data.debug.visibleOpenRequestCount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                  <p className="mt-1 text-sm text-card-foreground">{value}</p>
                </div>
              ))}
            </div>
          </SectionShell>
        ) : null}

        <SectionShell
          title="Station context"
          description="Choose the station to review or create cover requests for."
        >
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill tone="blue">
              {data.selectedStation?.name ?? "No station selected"}
            </StatusPill>
            <span className="text-sm text-muted-foreground">
              {data.selectedStation?.organisation_name ?? "Station scoped"}
            </span>
          </div>
          <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
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
              title="Create cover request"
              description="Add a full weekend, day, night, or custom cover request with optional asset, role, and duty context."
            >
              <form action={saveCoverRequestAction} className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2">
                <input type="hidden" name="station_id" value={data.selectedStationId} />
                <input type="hidden" name="return_path" value={stationActionPath} />
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Cover type</span>
                  <select
                    name="cover_type"
                    defaultValue="weekend"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="weekend">Weekend</option>
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="custom">Custom</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Urgency</span>
                  <select
                    name="urgency"
                    defaultValue="normal"
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Starts at</span>
                  <input
                    name="starts_at"
                    type="datetime-local"
                    defaultValue={defaultStart.toISOString().slice(0, 16)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Ends at</span>
                  <input
                    name="ends_at"
                    type="datetime-local"
                    defaultValue={defaultEnd.toISOString().slice(0, 16)}
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Duty period</span>
                  <select
                    name="original_duty_period_id"
                    defaultValue=""
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No duty period</option>
                    {data.dutyPeriods.map((period) => (
                      <option key={period.id} value={period.id}>
                        {period.period_kind.replace(/_/g, " ")} · {formatDateTime(period.starts_at)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Crew type</span>
                  <select
                    name="crew_type_id"
                    defaultValue=""
                    className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
                  >
                    <option value="">No crew type</option>
                    {data.crewTypes.map((crewType) => (
                      <option key={crewType.id} value={crewType.id}>
                        {crewType.name}
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
                    {data.assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name}
                      </option>
                    ))}
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
                  <span className="text-sm font-medium text-card-foreground">Reason</span>
                  <textarea
                    name="reason"
                    rows={3}
                    required
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                    placeholder="Why is cover needed?"
                  />
                </label>
                <label className="md:col-span-2 space-y-2">
                  <span className="text-sm font-medium text-card-foreground">Notes</span>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-foreground outline-none"
                    placeholder="Optional operational notes"
                  />
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
                    Create request
                  </button>
                </div>
              </form>
            </SectionShell>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Open requests", data.openCount],
                ["Urgent", data.urgentCount],
                ["Accepted", data.acceptedCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-card-foreground">{value as number}</p>
                </div>
              ))}
            </div>

            <SectionShell
              title="My requests"
              description="Open requests you created for your own station."
            >
              {myRequests.length ? (
                <div className="space-y-4">
                  {myRequests.map((item) => (
                    <RequestCard key={item.request.id} item={item} currentProfileId={data.currentProfile?.id ?? null} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  You have no open or historical cover requests yet.
                </div>
              )}
            </SectionShell>

        <SectionShell
          title="Station open cover requests"
          description="View the station cover requests that other crew may be able to take."
        >
          {activeRequests.length ? (
                <div className="space-y-4">
                  {activeRequests.map((item) => (
                    <RequestCard key={item.request.id} item={item} currentProfileId={data.currentProfile?.id ?? null} />
                  ))}
                </div>
              ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              No open station cover requests are available.
            </div>
          )}
        </SectionShell>

        <SectionShell
          title="Recent and resolved"
          description="Accepted, cancelled, and expired requests remain visible for operational awareness."
        >
          {data.coverRequests.filter((item) => item.request.status !== "open").length ? (
            <div className="space-y-4">
              {data.coverRequests
                .filter((item) => item.request.status !== "open")
                .map((item) => (
                  <RequestCard key={item.request.id} item={item} currentProfileId={data.currentProfile?.id ?? null} />
                ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              No recent cover requests yet.
            </div>
          )}
        </SectionShell>
      </>
        ) : (
          <SectionShell title="No station selected" description="Choose a station to load or create cover requests.">
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to continue.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
