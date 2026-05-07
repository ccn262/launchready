import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import {
  cancelCoverRequestAction,
  saveCoverRequestAction,
  saveCoverResponseAction,
} from "@/app/cover-actions";
import { buildRedirectUrl } from "@/lib/admin-crud";
import { loadAdminCoverPageData } from "@/lib/cover-requests";

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
}: Readonly<{
  item: Awaited<ReturnType<typeof loadAdminCoverPageData>>["coverRequests"][number];
}>) {
  const request = item.request;
  const openResponse = item.responses.find((response) => response.response_status !== "rejected" && response.response_status !== "withdrawn");

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

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Eligible crew</p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">
            {item.eligibleCrewCount ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 md:col-span-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Eligible names</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.eligibleCrewNames.length ? (
              item.eligibleCrewNames.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-card-foreground"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No eligible crew identified yet.</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Responses</p>
        {item.responses.length ? (
          <div className="space-y-2">
            {item.responses.map((response) => {
              const responder = response.responder && !Array.isArray(response.responder) ? response.responder : null;
              const canConfirm = request.status === "open" && response.response_status !== "accepted";

              return (
                <div key={response.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-card-foreground">
                        {responder?.display_name ?? responder?.email ?? response.responder_profile_id}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {response.response_status} · {response.eligibility_status.replace(/_/g, " ")}
                      </p>
                    </div>
                    <StatusPill tone={toneForEligibility(response.eligibility_status)}>
                      {response.eligibility_status.replace(/_/g, " ")}
                    </StatusPill>
                  </div>
                  {response.eligibility_notes ? (
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {response.eligibility_notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canConfirm ? (
                      <form action={saveCoverResponseAction}>
                        <input type="hidden" name="mode" value="confirm" />
                        <input type="hidden" name="response_id" value={response.id} />
                        <input type="hidden" name="cover_request_id" value={request.id} />
                        <input type="hidden" name="response_status" value="accepted" />
                        <input type="hidden" name="return_path" value="/admin/cover" />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
                        >
                          Confirm accepted
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No responses recorded yet.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {request.status === "open" ? (
          <form action={cancelCoverRequestAction}>
            <input type="hidden" name="cover_request_id" value={request.id} />
            <input type="hidden" name="return_path" value="/admin/cover" />
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Cancel request
            </button>
          </form>
        ) : null}

        {openResponse ? (
          <StatusPill tone={toneForEligibility(openResponse.eligibility_status)}>
            {openResponse.response_status}
          </StatusPill>
        ) : null}
      </div>
    </article>
  );
}

export default async function AdminCoverPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const success = getQueryValue(params.success);
  const error = getQueryValue(params.error);
  const requestedStationId = getQueryValue(params.stationId) || null;
  const data = await loadAdminCoverPageData("/admin/cover", requestedStationId);
  const stationActionPath = buildRedirectUrl("/admin/cover", { stationId: data.selectedStationId });
  const openRequests = data.coverRequests.filter((item) => item.request.status === "open");
  const acceptedRequests = data.coverRequests.filter((item) => item.request.status === "accepted");
  const cancelledRequests = data.coverRequests.filter((item) => item.request.status === "cancelled");
  const defaultStart = new Date();
  const defaultEnd = new Date(defaultStart.getTime() + 8 * 60 * 60 * 1000);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Cover"
          title="Station cover requests"
          summary="Station admins and LOMs can review open, urgent, accepted, and cancelled cover requests, see eligible crew counts, and confirm acceptance."
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
          title="Station context"
          description="Choose the station whose cover requests you want to manage."
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
              description="Admins can create a request on behalf of the station to keep manual cover tracking consistent."
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

            <div className="grid gap-4 md:grid-cols-4">
              {[
                ["Open", openRequests.length],
                ["Urgent", data.urgentCount],
                ["Accepted", acceptedRequests.length],
                ["Cancelled", cancelledRequests.length],
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{label}</p>
                  <p className="mt-2 text-3xl font-semibold text-card-foreground">{value as number}</p>
                </div>
              ))}
            </div>

            <SectionShell
              title="Open requests"
              description="Station requests that are still open and may need crew cover."
            >
              {openRequests.length ? (
                <div className="space-y-4">
                  {openRequests.map((item) => (
                    <RequestCard key={item.request.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No open cover requests are currently active.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Accepted and cancelled"
              description="Recent resolved cover requests remain visible for operational awareness and audit traceability."
            >
              {acceptedRequests.length || cancelledRequests.length ? (
                <div className="space-y-4">
                  {[...acceptedRequests, ...cancelledRequests].map((item) => (
                    <RequestCard key={item.request.id} item={item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No accepted or cancelled requests yet.
                </div>
              )}
            </SectionShell>

            <SectionShell
              title="Recent / past cover requests"
              description="All non-open station requests remain visible so historical requests do not disappear."
            >
              {data.coverRequests.filter((item) => item.request.status !== "open").length ? (
                <div className="space-y-4">
                  {data.coverRequests
                    .filter((item) => item.request.status !== "open")
                    .map((item) => (
                      <RequestCard key={item.request.id} item={item} />
                    ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
                  No historical cover requests yet.
                </div>
              )}
            </SectionShell>
          </>
        ) : (
          <SectionShell title="No station selected" description="Choose a station to manage cover requests.">
            <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-6 text-sm text-muted-foreground">
              Select a station above to review or create requests.
            </div>
          </SectionShell>
        )}
      </div>
    </AppShell>
  );
}
