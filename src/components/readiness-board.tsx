import Link from "next/link";
import { CrewCapabilityBadges } from "@/components/crew-capability-badges";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import type {
  ReadinessAssetSummary,
  ReadinessSnapshot,
  ReadinessStatus,
} from "@/lib/readiness";

const statusToneMap: Record<ReadinessStatus, "green" | "amber" | "red" | "blue" | "grey"> = {
  launch_ready: "green",
  degraded: "amber",
  delayed_launch_possible: "amber",
  not_launch_ready: "red",
  off_service: "red",
  non_sar_capable_exercise_only: "grey",
  unknown: "grey",
};

function getStatusCopy(status: ReadinessStatus) {
  switch (status) {
    case "launch_ready":
      return "Launch ready";
    case "degraded":
      return "Degraded";
    case "delayed_launch_possible":
      return "Delayed launch possible";
    case "not_launch_ready":
      return "Not launch ready";
    case "off_service":
      return "Off service";
    case "non_sar_capable_exercise_only":
      return "Exercise only";
    case "unknown":
    default:
      return "Unknown";
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat("en-GB").format(value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function summaryTone(value: ReadinessStatus) {
  return statusToneMap[value];
}

function RequirementList({
  title,
  items,
  emptyLabel,
}: Readonly<{
  title: string;
  items: ReadonlyArray<{ id: string; label: string; severity?: "hard_stop" | "required" | "preferred" }>;
  emptyLabel: string;
}>) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
        {title}
      </p>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <span className="leading-6 text-card-foreground">{item.label}</span>
              {item.severity ? (
                <StatusPill tone={item.severity === "hard_stop" ? "red" : item.severity === "required" ? "amber" : "grey"}>
                  {item.severity}
                </StatusPill>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </div>
  );
}

function AssetReadinessCard({ asset }: Readonly<{ asset: ReadinessAssetSummary }>) {
  return (
    <article className="rounded-3xl border border-white/10 bg-slate-950/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-base font-semibold text-card-foreground">{asset.asset.name}</p>
          <p className="text-xs text-muted-foreground">
            {asset.location?.name ?? "No location"} · {asset.assetType?.name ?? "Asset type unknown"}
          </p>
        </div>
        <StatusPill tone={summaryTone(asset.status)}>{getStatusCopy(asset.status)}</StatusPill>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Crew count</p>
          <p className="mt-2 text-2xl font-semibold text-card-foreground">
            {formatCount(asset.availableCrewCount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Minimum {formatCount(asset.minimumCrew)}
            {asset.maximumCrew !== null ? ` · Max ${formatCount(asset.maximumCrew)}` : ""}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Crew capability badges</p>
          <div className="mt-2">
            <CrewCapabilityBadges items={asset.capabilityBadges} emptyLabel="No current green capability badges" />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        <RequirementList
          title="Missing roles"
          items={asset.missingRoles}
          emptyLabel="No missing boat crew roles."
        />
        <RequirementList
          title="Launch / recovery gaps"
          items={asset.launchRecoveryGaps}
          emptyLabel="No launch / recovery gaps."
        />
        <RequirementList
          title="Preferred gaps"
          items={asset.preferredGaps}
          emptyLabel="No preferred gaps."
        />
      </div>

      {asset.currentCrew.length ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current crew</p>
          <div className="flex flex-wrap gap-2 text-sm text-card-foreground">
            {asset.currentCrew.map((member) => (
              <span
                key={member.profile.id}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
              >
                {member.profile.display_name ?? member.profile.email ?? member.profile.id}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function ReadinessBoard({
  snapshot,
}: Readonly<{
  snapshot: ReadinessSnapshot;
}>) {
  const stationSummary = snapshot.stationSummary;

  if (!stationSummary) {
    return (
      <SectionShell
        title="Personal readiness"
        description="Crew users can see their own operational footprint until station-wide visibility is permitted."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                  Current station
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-card-foreground">
                  {snapshot.personalSummary?.stationName ?? "Station unavailable"}
                </h3>
              </div>
              <StatusPill tone="grey">Personal scope</StatusPill>
            </div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Station-wide readiness is restricted by the current role. Personal
              availability and duty summaries remain visible here.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Availability slots
                </p>
                <p className="mt-2 text-3xl font-semibold text-card-foreground">
                  {formatCount(snapshot.personalSummary?.currentAvailabilityCount ?? 0)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Duty periods
                </p>
                <p className="mt-2 text-3xl font-semibold text-card-foreground">
                  {formatCount(snapshot.personalSummary?.assignedDutyCount ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
              Capability badges
            </p>
            <div className="mt-3">
              <CrewCapabilityBadges
                items={snapshot.personalSummary?.currentCapabilityBadges ?? []}
                emptyLabel="No personal capability badges"
              />
            </div>
          </div>
        </div>
      </SectionShell>
    );
  }

  return (
    <div className="space-y-6">
      <SectionShell
        title={`${stationSummary.stationName} readiness`}
        description="Launch readiness is calculated from asset-specific roles, current availability, duty periods, qualifications, and the baseline safe-crewing roadmap."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Status</p>
            <StatusPill tone={summaryTone(stationSummary.status)}>{getStatusCopy(stationSummary.status)}</StatusPill>
            <p className="mt-3 text-2xl font-semibold text-card-foreground">{stationSummary.statusLabel}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Assessment window</p>
            <p className="mt-3 text-base font-semibold text-card-foreground">{stationSummary.window.label}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDateTime(stationSummary.window.startsAt)} to {formatDateTime(stationSummary.window.endsAt)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Crew</p>
            <p className="mt-3 text-3xl font-semibold text-card-foreground">
              {formatCount(stationSummary.availableCrewCount)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">Available crew for the selected window</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-950/55 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Current DLA</p>
            <p className="mt-3 text-base font-semibold text-card-foreground">
              {stationSummary.currentDla?.display_name ?? "No active DLA period"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {stationSummary.currentDla?.email ?? "Station DLA placeholder"}
            </p>
          </div>
        </div>
      </SectionShell>

      <SectionShell title="Station coverage" description="Location-level readiness highlights operational gaps without authorising launches.">
        <div className="grid gap-4 xl:grid-cols-2">
          {stationSummary.locations.map((location) => (
            <div key={location.location.id} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">{location.location.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{location.statusLabel}</p>
                </div>
                <StatusPill tone={summaryTone(location.status)}>{getStatusCopy(location.status)}</StatusPill>
              </div>
              <div className="mt-4 space-y-4">
                {location.assets.map((asset) => (
                  <AssetReadinessCard key={asset.asset.id} asset={asset} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        title="Station-wide gaps"
        description="Hard-stop roles remain blocking, preferred gaps are advisory, and launch/recovery gaps are tracked separately."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <RequirementList
            title="Missing roles"
            items={stationSummary.missingRoles}
            emptyLabel="No station-wide missing roles."
          />
          <RequirementList
            title="Launch / recovery gaps"
            items={stationSummary.launchRecoveryGaps}
            emptyLabel="No station-wide launch / recovery gaps."
          />
        </div>
      </SectionShell>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/admin/readiness"
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
        >
          Open readiness console
        </Link>
      </div>
    </div>
  );
}
