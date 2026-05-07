import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildStationOptionsFromContext } from "@/lib/phase6";
import { requireRouteAccess, type CurrentUserContext } from "@/lib/auth";
import type { StationOption, AssetRecord, StationLocationRecord } from "@/lib/admin-crud";
import type { OperationType, ReadinessAssetSummary, ReadinessSnapshot } from "@/lib/readiness";
import type { CrewProfileRecord } from "@/lib/admin-phase5";

export type IncidentDbStatus = "open" | "active" | "stood_down" | "closed" | "cancelled";
export type IncidentDisplayStatus = "draft" | "initiated" | "standing_down" | "closed" | "cancelled";

export type IncidentResponseStatus =
  | "awaiting_response"
  | "attending"
  | "not_attending"
  | "delayed"
  | "fallback_available";

export type IncidentRecord = {
  id: string;
  organisation_id: string;
  station_id: string;
  station_location_id: string | null;
  reported_by_profile_id: string | null;
  launch_authority_profile_id: string | null;
  status: IncidentDbStatus;
  operation_type: OperationType;
  incident_type: string;
  title: string;
  summary: string | null;
  location_notes: string | null;
  dynamic_risk_assessment_notes: string | null;
  readiness_snapshot: Record<string, unknown>;
  selected_asset_ids: string[];
  drafted_at: string;
  initiated_at: string | null;
  launched_at: string | null;
  stood_down_at: string | null;
  closed_at: string | null;
  cancelled_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type IncidentAssetRecord = {
  id: string;
  incident_id: string;
  asset_id: string;
  readiness_status_at_initiation: string | null;
  readiness_snapshot: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type IncidentResponseRecord = {
  id: string;
  incident_id: string;
  profile_id: string;
  response_status: IncidentResponseStatus | string;
  eta_minutes: number | null;
  notes: string | null;
  responded_at: string;
  created_at: string;
  updated_at: string;
  responder: CrewProfileRecord | null;
};

export type IncidentAssetSummary = {
  id: string;
  assetId: string;
  assetName: string;
  locationName: string | null;
  assetTypeName: string | null;
  readinessStatusAtInitiation: string | null;
  readinessSnapshot: Record<string, unknown>;
  notes: string | null;
};

export type IncidentSummaryItem = {
  incident: IncidentRecord;
  statusLabel: string;
  statusTone: "green" | "amber" | "red" | "grey";
  reporterName: string;
  launchAuthorityName: string | null;
  stationLocationName: string | null;
  selectedAssetNames: string[];
  selectedAssets: IncidentAssetSummary[];
  responses: IncidentResponseRecord[];
  attendingCount: number;
  notAttendingCount: number;
  delayedCount: number;
  fallbackAvailableCount: number;
  awaitingCount: number;
};

export type IncidentBoardData = {
  context: CurrentUserContext;
  stationOptions: StationOption[];
  selectedStationId: string | null;
  selectedStation: StationOption | null;
  incidents: IncidentSummaryItem[];
  activeIncidents: IncidentSummaryItem[];
  draftIncidents: IncidentSummaryItem[];
  recentIncidents: IncidentSummaryItem[];
  activeCount: number;
  draftCount: number;
  closedCount: number;
  cancelledCount: number;
  responseCount: number;
};

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function getLabel(profile: CrewProfileRecord | null) {
  return profile?.display_name ?? profile?.email ?? profile?.id ?? "Unknown crew member";
}

function getIncidentStatusLabel(status: IncidentDbStatus) {
  switch (status) {
    case "open":
      return "Draft";
    case "active":
      return "Initiated";
    case "stood_down":
      return "Standing down";
    case "closed":
      return "Closed";
    case "cancelled":
      return "Cancelled";
  }
}

function getIncidentStatusTone(status: IncidentDbStatus) {
  switch (status) {
    case "open":
      return "grey" as const;
    case "active":
      return "green" as const;
    case "stood_down":
      return "amber" as const;
    case "closed":
      return "grey" as const;
    case "cancelled":
      return "red" as const;
  }
}

async function loadIncidentRows(stationId: string | null) {
  const supabase = await createSupabaseServerClient();

  if (!stationId) {
    return {
      incidents: [] as IncidentRecord[],
      incidentAssets: [] as IncidentAssetRecord[],
      incidentResponses: [] as IncidentResponseRecord[],
    };
  }

  const [incidentResult, assetResult, responseResult] = await Promise.all([
    supabase
      .from("incidents")
      .select(
        `
          id,
          organisation_id,
          station_id,
          station_location_id,
          reported_by_profile_id,
          launch_authority_profile_id,
          status,
          operation_type,
          incident_type,
          title,
          summary,
          location_notes,
          dynamic_risk_assessment_notes,
          readiness_snapshot,
          selected_asset_ids,
          drafted_at,
          initiated_at,
          launched_at,
          stood_down_at,
          closed_at,
          cancelled_at,
          is_active,
          created_at,
          updated_at
        `,
      )
      .eq("station_id", stationId)
      .order("created_at", { ascending: false }),
    supabase
      .from("incident_assets")
      .select(
        `
          id,
          incident_id,
          asset_id,
          readiness_status_at_initiation,
          readiness_snapshot,
          notes,
          created_at,
          updated_at
        `,
      )
      .order("created_at", { ascending: true }),
    supabase
      .from("incident_responses")
      .select(
        `
          id,
          incident_id,
          profile_id,
          response_status,
          responded_at,
          notes,
          created_at,
          updated_at
        `,
      )
      .order("created_at", { ascending: true }),
  ]);

  return {
    incidents: ((incidentResult.data ?? []) as unknown as Array<Record<string, unknown>>).map((incident) => ({
      id: String(incident.id),
      organisation_id: String(incident.organisation_id),
      station_id: String(incident.station_id),
      station_location_id: (incident.station_location_id as string | null) ?? null,
      reported_by_profile_id: (incident.reported_by_profile_id as string | null) ?? null,
      launch_authority_profile_id: (incident.launch_authority_profile_id as string | null) ?? null,
      status: incident.status as IncidentDbStatus,
      operation_type: incident.operation_type as OperationType,
      incident_type: String(incident.incident_type ?? "launch"),
      title: String(incident.title),
      summary: (incident.summary as string | null) ?? null,
      location_notes: (incident.location_notes as string | null) ?? null,
      dynamic_risk_assessment_notes: (incident.dynamic_risk_assessment_notes as string | null) ?? null,
      readiness_snapshot: ((incident.readiness_snapshot as Record<string, unknown> | null) ?? {}) as Record<string, unknown>,
      selected_asset_ids: readStringArray(incident.selected_asset_ids),
      drafted_at: String(incident.drafted_at ?? incident.created_at),
      initiated_at: (incident.initiated_at as string | null) ?? null,
      launched_at: (incident.launched_at as string | null) ?? null,
      stood_down_at: (incident.stood_down_at as string | null) ?? null,
      closed_at: (incident.closed_at as string | null) ?? null,
      cancelled_at: (incident.cancelled_at as string | null) ?? null,
      is_active: Boolean(incident.is_active),
      created_at: String(incident.created_at),
      updated_at: String(incident.updated_at),
    })) as IncidentRecord[],
    incidentAssets: ((assetResult.data ?? []) as unknown as Array<Record<string, unknown>>).map((asset) => ({
      id: String(asset.id),
      incident_id: String(asset.incident_id),
      asset_id: String(asset.asset_id),
      readiness_status_at_initiation: (asset.readiness_status_at_initiation as string | null) ?? null,
      readiness_snapshot: ((asset.readiness_snapshot as Record<string, unknown> | null) ?? {}) as Record<string, unknown>,
      notes: (asset.notes as string | null) ?? null,
      created_at: String(asset.created_at),
      updated_at: String(asset.updated_at),
    })) as IncidentAssetRecord[],
    incidentResponses: ((responseResult.data ?? []) as unknown as Array<Record<string, unknown>>).map((response) => ({
      id: String(response.id),
      incident_id: String(response.incident_id),
      profile_id: String(response.profile_id),
      response_status: String(response.response_status) as IncidentResponseStatus | string,
      eta_minutes: typeof response.eta_minutes === "number" ? response.eta_minutes : null,
      notes: (response.notes as string | null) ?? null,
      responded_at: String(response.responded_at ?? response.created_at),
      created_at: String(response.created_at),
      updated_at: String(response.updated_at),
      responder: null,
    })) as IncidentResponseRecord[],
  };
}

function buildIncidentSummaryItem(params: {
  incident: IncidentRecord;
  reporter: CrewProfileRecord | null;
  launchAuthority: CrewProfileRecord | null;
  location: StationLocationRecord | null;
  incidentAssets: IncidentAssetSummary[];
  draftAssetNames: string[];
  responses: IncidentResponseRecord[];
}) {
  const responseCounts = params.responses.reduce(
    (counts, response) => {
      switch (response.response_status) {
        case "attending":
          counts.attendingCount += 1;
          break;
        case "not_attending":
          counts.notAttendingCount += 1;
          break;
        case "delayed":
          counts.delayedCount += 1;
          break;
        case "fallback_available":
          counts.fallbackAvailableCount += 1;
          break;
        default:
          counts.awaitingCount += 1;
          break;
      }

      return counts;
    },
    {
      attendingCount: 0,
      notAttendingCount: 0,
      delayedCount: 0,
      fallbackAvailableCount: 0,
      awaitingCount: 0,
    },
  );

  return {
    incident: params.incident,
    statusLabel: getIncidentStatusLabel(params.incident.status),
    statusTone: getIncidentStatusTone(params.incident.status),
    reporterName: getLabel(params.reporter),
    launchAuthorityName: params.launchAuthority ? getLabel(params.launchAuthority) : null,
    stationLocationName: params.location?.name ?? null,
    selectedAssetNames: params.incidentAssets.length ? params.incidentAssets.map((asset) => asset.assetName) : params.draftAssetNames,
    selectedAssets: params.incidentAssets,
    responses: params.responses,
    ...responseCounts,
  } satisfies IncidentSummaryItem;
}

export async function loadIncidentBoardData(pathname: string, requestedStationId: string | null) {
  noStore();
  const context = await requireRouteAccess(pathname);
  const stationOptions = buildStationOptionsFromContext(context);
  const selectedStationId =
    (requestedStationId && stationOptions.some((station) => station.id === requestedStationId)
      ? requestedStationId
      : null) ?? stationOptions[0]?.id ?? null;
  const selectedStation = stationOptions.find((station) => station.id === selectedStationId) ?? null;
  const { incidents, incidentAssets, incidentResponses } = await loadIncidentRows(selectedStationId);

  const profileIds = Array.from(
    new Set([
      ...incidents.map((incident) => incident.reported_by_profile_id).filter((value): value is string => Boolean(value)),
      ...incidents.map((incident) => incident.launch_authority_profile_id).filter((value): value is string => Boolean(value)),
      ...incidentResponses.map((response) => response.profile_id),
    ]),
  );
  const locationIds = Array.from(
    new Set(incidents.map((incident) => incident.station_location_id).filter((value): value is string => Boolean(value))),
  );
  const assetIds = Array.from(
    new Set([
      ...incidents.flatMap((incident) => incident.selected_asset_ids),
      ...incidentAssets.map((asset) => asset.asset_id),
    ]),
  );

  const supabase = await createSupabaseServerClient();
  const [profilesResult, locationsResult, assetsResult] = await Promise.all([
    profileIds.length
      ? supabase
          .from("profiles")
          .select("id, display_name, email, phone, system_role, is_active")
          .in("id", profileIds)
      : Promise.resolve({ data: [] as CrewProfileRecord[] }),
    locationIds.length
      ? supabase
          .from("station_locations")
          .select("id, station_id, name, slug, sort_order, notes, is_active")
          .in("id", locationIds)
      : Promise.resolve({ data: [] as StationLocationRecord[] }),
    assetIds.length
      ? supabase
          .from("assets")
          .select(
            `
              id,
              station_id,
              station_location_id,
              asset_type_id,
              name,
              asset_code,
              status,
              requires_recovery_support,
              notes,
              metadata,
              is_active
            `,
          )
          .in("id", assetIds)
      : Promise.resolve({ data: [] as AssetRecord[] }),
  ]);

  const profileMap = new Map<string, CrewProfileRecord>();
  for (const profile of (profilesResult.data ?? []) as CrewProfileRecord[]) {
    profileMap.set(profile.id, profile);
  }

  const locationMap = new Map<string, StationLocationRecord>();
  for (const location of (locationsResult.data ?? []) as StationLocationRecord[]) {
    locationMap.set(location.id, location);
  }

  const assetMap = new Map<string, AssetRecord>();
  for (const asset of (assetsResult.data ?? []) as AssetRecord[]) {
    assetMap.set(asset.id, asset);
  }

  const responseMap = new Map<string, IncidentResponseRecord[]>();
  for (const response of incidentResponses) {
    const responder = profileMap.get(response.profile_id) ?? null;
    const existing = responseMap.get(response.incident_id) ?? [];
    responseMap.set(response.incident_id, [
      ...existing,
      {
        ...response,
        responder,
      },
    ]);
  }

  const incidentAssetMap = new Map<string, IncidentAssetSummary[]>();
  for (const incidentAsset of incidentAssets) {
    const asset = assetMap.get(incidentAsset.asset_id);
    const existing = incidentAssetMap.get(incidentAsset.incident_id) ?? [];
    incidentAssetMap.set(incidentAsset.incident_id, [
      ...existing,
      {
        id: incidentAsset.id,
        assetId: incidentAsset.asset_id,
        assetName: asset?.name ?? incidentAsset.asset_id,
        locationName: asset
          ? locationMap.get(asset.station_location_id)?.name ?? null
          : null,
        assetTypeName: null,
        readinessStatusAtInitiation: incidentAsset.readiness_status_at_initiation,
        readinessSnapshot: incidentAsset.readiness_snapshot,
        notes: incidentAsset.notes,
      },
    ]);
  }

  const draftAssetNameMap = new Map<string, string[]>();
  for (const incident of incidents) {
    const names = incident.selected_asset_ids
      .map((assetId) => assetMap.get(assetId)?.name ?? assetId)
      .filter((value): value is string => Boolean(value));

    if (names.length) {
      draftAssetNameMap.set(incident.id, names);
    }
  }

  const incidentItems = incidents.map((incident) =>
    buildIncidentSummaryItem({
      incident,
      reporter: incident.reported_by_profile_id ? profileMap.get(incident.reported_by_profile_id) ?? null : null,
      launchAuthority: incident.launch_authority_profile_id
        ? profileMap.get(incident.launch_authority_profile_id) ?? null
        : null,
      location: incident.station_location_id ? locationMap.get(incident.station_location_id) ?? null : null,
      incidentAssets: incidentAssetMap.get(incident.id) ?? [],
      draftAssetNames: draftAssetNameMap.get(incident.id) ?? [],
      responses: responseMap.get(incident.id) ?? [],
    }),
  );

  const activeIncidents = incidentItems.filter((item) => item.incident.status === "active");
  const draftIncidents = incidentItems.filter((item) => item.incident.status === "open");
  const recentIncidents = incidentItems.slice(0, 6);
  const closedCount = incidentItems.filter((item) => item.incident.status === "closed").length;
  const cancelledCount = incidentItems.filter((item) => item.incident.status === "cancelled").length;
  const responseCount = incidentResponses.length;

  return {
    context,
    stationOptions,
    selectedStationId,
    selectedStation,
    incidents: incidentItems,
    activeIncidents,
    draftIncidents,
    recentIncidents,
    activeCount: activeIncidents.length,
    draftCount: draftIncidents.length,
    closedCount,
    cancelledCount,
    responseCount,
  } satisfies IncidentBoardData;
}

export function buildIncidentReadinessSnapshot(params: {
  snapshot: ReadinessSnapshot;
  coverRequestCount: number;
  selectedAssetSummaries: ReadinessAssetSummary[];
  operationType: OperationType;
}) {
  return {
    captured_at: new Date().toISOString(),
    operation_type: params.operationType,
    station: {
      station_id: params.snapshot.selectedStationId,
      station_name: params.snapshot.selectedStation?.name ?? params.snapshot.stationSummary?.stationName ?? null,
      status: params.snapshot.stationSummary?.status ?? null,
      status_label: params.snapshot.stationSummary?.statusLabel ?? null,
      current_dla: params.snapshot.stationSummary?.currentDla ?? null,
    },
    window: params.snapshot.window,
    readiness: params.snapshot.stationSummary,
    cover_requests_affecting_readiness: params.coverRequestCount,
    selected_assets: params.selectedAssetSummaries,
  };
}
