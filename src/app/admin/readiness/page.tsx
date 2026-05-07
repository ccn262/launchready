import { AppShell } from "@/components/app-shell";
import { PageHero } from "@/components/page-hero";
import { ReadinessBoard } from "@/components/readiness-board";
import { loadReadinessSnapshot, type OperationType, type ReadinessWindowPreset } from "@/lib/readiness";

function getQueryValue(value: string | string[] | undefined, fallback = "") {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

const operationOptions: ReadonlyArray<{ value: OperationType; label: string }> = [
  { value: "service", label: "Service" },
  { value: "exercise", label: "Exercise" },
  { value: "passage", label: "Passage" },
  { value: "boat_movement", label: "Boat movement" },
  { value: "assurance_activity", label: "Assurance activity" },
];

const windowOptions: ReadonlyArray<{ value: ReadinessWindowPreset; label: string }> = [
  { value: "current", label: "Current" },
  { value: "day", label: "Day 07:00–19:00" },
  { value: "night", label: "Night 19:00–07:00" },
  { value: "weekend", label: "Weekend Fri 19:00–Mon 07:00" },
  { value: "custom", label: "Custom" },
];

export default async function AdminReadinessPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const requestedStationId = getQueryValue(params.stationId) || null;
  const operationType = getQueryValue(params.operation) as OperationType | "";
  const windowPreset = getQueryValue(params.window) as ReadinessWindowPreset | "";
  const customStartsAt = getQueryValue(params.startsAt) || null;
  const customEndsAt = getQueryValue(params.endsAt) || null;

  const snapshot = await loadReadinessSnapshot({
    pathname: "/admin/readiness",
    requestedStationId,
    operationType: operationType || "service",
    windowPreset: windowPreset || "current",
    customStartsAt,
    customEndsAt,
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin / Readiness"
          title="Readiness console"
          summary="This station-scoped view combines safe-crewing rules, current availability, duty periods, and asset-specific roles into one operational summary."
        />

        <form method="get" className="grid gap-4 rounded-3xl border border-white/10 bg-slate-950/50 p-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-sm font-medium text-card-foreground">Station</span>
            <select
              name="stationId"
              defaultValue={snapshot.selectedStationId ?? ""}
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
            >
              <option value="">Select station</option>
              {snapshot.stationOptions.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.name} · {station.organisation_name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-card-foreground">Operation type</span>
            <select
              name="operation"
              defaultValue={snapshot.operationType}
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
            >
              {operationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-card-foreground">Window</span>
            <select
              name="window"
              defaultValue={snapshot.window.key}
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
            >
              {windowOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
            >
              Refresh
            </button>
          </div>
          <label className="space-y-2 md:col-span-1 xl:col-span-2">
            <span className="text-sm font-medium text-card-foreground">Custom starts at</span>
            <input
              type="datetime-local"
              name="startsAt"
              defaultValue={customStartsAt ?? ""}
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
            />
          </label>
          <label className="space-y-2 md:col-span-1 xl:col-span-2">
            <span className="text-sm font-medium text-card-foreground">Custom ends at</span>
            <input
              type="datetime-local"
              name="endsAt"
              defaultValue={customEndsAt ?? ""}
              className="h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none"
            />
          </label>
        </form>

        <ReadinessBoard snapshot={snapshot} />
      </div>
    </AppShell>
  );
}
