import "server-only";

import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAdminAccessContext,
  resolveSelectedStationContext,
  type StationOption,
  type AssetRecord,
  type SelectedStationContext,
} from "@/lib/admin-crud";
import {
  buildStationOptionsFromContext,
  loadAdminAvailabilityContext,
  loadCrewAvailabilityContext,
  type AvailabilitySlotRecord,
  type DutyPeriodRecord,
} from "@/lib/phase6";
import {
  loadCrewTypes,
  type CrewProfileRecord,
  type CrewQualificationRecord,
  type OperationalRoleRecord,
  type StationMembershipRecord,
} from "@/lib/admin-phase5";
import { requireRouteAccess, type CurrentUserContext } from "@/lib/auth";

export type CoverRequestCoverType = "weekend" | "day" | "night" | "custom";
export type CoverRequestStatus = "open" | "accepted" | "cancelled" | "expired";
export type CoverRequestUrgency = "normal" | "urgent";
export type CoverResponseStatus = "offered" | "accepted" | "withdrawn" | "rejected";
export type CoverEligibilityStatus = "eligible" | "ineligible" | "needs_admin_review";

export type CoverRequestProfileRecord = CrewProfileRecord;

export type CoverRequestCrewTypeRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type CoverRequestDutyPeriodRecord = {
  id: string;
  station_id: string;
  profile_id: string | null;
  station_location_id: string | null;
  asset_type_id: string | null;
  asset_id: string | null;
  operational_role_id: string | null;
  period_kind: DutyPeriodRecord["period_kind"];
  duty_date: string;
  start_time: string;
  end_time: string;
  starts_at: string | null;
  ends_at: string | null;
  source: string;
  notes: string | null;
  is_active: boolean;
  created_by_profile_id: string | null;
};

export type CoverRequestRecord = {
  id: string;
  station_id: string;
  requester_profile_id: string;
  original_duty_period_id: string | null;
  asset_id: string | null;
  operational_role_id: string | null;
  crew_type_id: string | null;
  cover_type: CoverRequestCoverType;
  starts_at: string;
  ends_at: string;
  status: CoverRequestStatus;
  urgency: CoverRequestUrgency;
  reason: string;
  notes: string | null;
  accepted_by_profile_id: string | null;
  accepted_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  requester: CoverRequestProfileRecord | CoverRequestProfileRecord[] | null;
  asset: AssetRecord | AssetRecord[] | null;
  operational_role: OperationalRoleRecord | OperationalRoleRecord[] | null;
  crew_type:
    | CoverRequestCrewTypeRecord
    | CoverRequestCrewTypeRecord[]
    | null;
  original_duty_period:
    | CoverRequestDutyPeriodRecord
    | CoverRequestDutyPeriodRecord[]
    | null;
  accepted_by_profile:
    | CoverRequestProfileRecord
    | CoverRequestProfileRecord[]
    | null;
};

export type CoverRequestResponseRecord = {
  id: string;
  cover_request_id: string;
  responder_profile_id: string;
  response_status: CoverResponseStatus;
  eligibility_status: CoverEligibilityStatus;
  eligibility_notes: string | null;
  notes: string | null;
  responded_at: string;
  created_at: string;
  updated_at: string;
  responder: CoverRequestProfileRecord | CoverRequestProfileRecord[] | null;
  cover_request:
    | Pick<
        CoverRequestRecord,
        | "id"
        | "station_id"
        | "requester_profile_id"
        | "asset_id"
        | "operational_role_id"
        | "crew_type_id"
        | "cover_type"
        | "starts_at"
        | "ends_at"
        | "status"
        | "urgency"
        | "reason"
        | "notes"
        | "accepted_by_profile_id"
        | "accepted_at"
        | "resolved_at"
      >
    | Pick<
        CoverRequestRecord,
        | "id"
        | "station_id"
        | "requester_profile_id"
        | "asset_id"
        | "operational_role_id"
        | "crew_type_id"
        | "cover_type"
        | "starts_at"
        | "ends_at"
        | "status"
        | "urgency"
        | "reason"
        | "notes"
        | "accepted_by_profile_id"
        | "accepted_at"
        | "resolved_at"
      >[]
    | null;
};

export type CoverRequestCandidate = {
  profile: CoverRequestProfileRecord;
  membership: StationMembershipRecord;
  qualifications: CrewQualificationRecord[];
  availabilitySlots: AvailabilitySlotRecord[];
  dutyPeriods: DutyPeriodRecord[];
};

export type CoverRequestEligibility = {
  status: CoverEligibilityStatus;
  notes: string[];
  eligible: boolean;
};

export type CoverRequestSummaryItem = {
  request: CoverRequestRecord;
  responses: CoverRequestResponseRecord[];
  requesterName: string;
  requestLabel: string;
  assetName: string | null;
  roleName: string | null;
  crewTypeName: string | null;
  eligibleCrewCount: number | null;
  eligibleCrewNames: string[];
  myEligibility: CoverRequestEligibility | null;
};

export type CoverRequestOverview = {
  context: CurrentUserContext;
  selectedStationId: string | null;
  selectedStation: StationOption | null;
  stationOptions: StationOption[];
  requests: CoverRequestSummaryItem[];
  openCount: number;
  urgentCount: number;
  acceptedCount: number;
  cancelledCount: number;
  ownRequests: CoverRequestSummaryItem[];
  responsesByRequestId: Map<string, CoverRequestResponseRecord[]>;
  debug: {
    selectedStationId: string | null;
    currentProfileId: string | null;
    loadedCoverRequestCount: number;
    visibleOpenRequestCount: number;
  } | null;
};

export type AdminCoverRequestData = CoverRequestOverview & {
  crewTypes: CoverRequestCrewTypeRecord[];
  memberships: StationMembershipRecord[];
  availabilitySlots: AvailabilitySlotRecord[];
  dutyPeriods: DutyPeriodRecord[];
  crewQualifications: CrewQualificationRecord[];
  assets: AssetRecord[];
  operationalRoles: OperationalRoleRecord[];
  ownMembership: StationMembershipRecord | null;
};

function getFirstRecord<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function rangesOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

function hasCurrentQualification(
  qualification: CrewQualificationRecord,
  request: CoverRequestRecord,
  windowEnd: Date,
) {
  if (!qualification.is_active || qualification.currency_state !== "green") {
    return false;
  }

  if (qualification.expires_on) {
    const expiry = parseDate(qualification.expires_on);
    if (!expiry || expiry < windowEnd) {
      return false;
    }
  }

  if (request.operational_role_id && qualification.operational_role_id !== request.operational_role_id) {
    return false;
  }

  if (request.asset_id && qualification.asset_id !== request.asset_id) {
    return false;
  }

  return Boolean(qualification.operational_role_id || qualification.asset_id || qualification.asset_type_id);
}

function getAvailabilityStatus(
  candidate: Pick<CoverRequestCandidate, "availabilitySlots">,
  request: CoverRequestRecord,
) {
  const requestStart = parseDate(request.starts_at);
  const requestEnd = parseDate(request.ends_at);

  if (!requestStart || !requestEnd) {
    return { status: "needs_admin_review" as const, notes: ["Cover request window is invalid."] };
  }

  const overlappingSlots = candidate.availabilitySlots.filter((slot) => {
    if (!slot.is_active) {
      return false;
    }

    const slotStart = parseDate(slot.starts_at);
    const slotEnd = parseDate(slot.ends_at);

    if (!slotStart || !slotEnd) {
      return false;
    }

    return rangesOverlap(slotStart, slotEnd, requestStart, requestEnd);
  });

  if (
    overlappingSlots.some((slot) => slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable")
  ) {
    return {
      status: "ineligible" as const,
      notes: ["An overlapping unavailable slot blocks this cover window."],
    };
  }

  if (overlappingSlots.length === 0) {
    return {
      status: "needs_admin_review" as const,
      notes: ["No explicit availability slot was found for the requested window."],
    };
  }

  return {
    status: "eligible" as const,
    notes: ["An active availability slot overlaps the requested cover window."],
  };
}

function getDutyConflictStatus(
  candidate: Pick<CoverRequestCandidate, "dutyPeriods">,
  request: CoverRequestRecord,
) {
  const requestStart = parseDate(request.starts_at);
  const requestEnd = parseDate(request.ends_at);

  if (!requestStart || !requestEnd) {
    return { status: "needs_admin_review" as const, notes: ["Cover request window is invalid."] };
  }

  const conflictingDuty = candidate.dutyPeriods.find((period) => {
    if (!period.is_active) {
      return false;
    }

    const periodStart = parseDate(period.starts_at);
    const periodEnd = parseDate(period.ends_at);

    if (!periodStart || !periodEnd) {
      return false;
    }

    return rangesOverlap(periodStart, periodEnd, requestStart, requestEnd);
  });

  if (conflictingDuty) {
    return {
      status: "ineligible" as const,
      notes: ["An existing active duty period overlaps the requested cover window."],
    };
  }

  return { status: "eligible" as const, notes: ["No conflicting duty period was found."] };
}

function getRoleMatchStatus(candidate: CoverRequestCandidate, request: CoverRequestRecord) {
  const requestRoleId = request.operational_role_id;
  const requestAssetId = request.asset_id;
  const requestCrewTypeId = request.crew_type_id;

  if (requestCrewTypeId && candidate.membership.crew_type_id !== requestCrewTypeId) {
    return {
      status: "ineligible" as const,
      notes: ["Crew type does not match the requested cover role."],
    };
  }

  if (!requestRoleId && !requestAssetId) {
    return {
      status: "eligible" as const,
      notes: ["No specific role or asset was required for this cover request."],
    };
  }

  const matchingQualification = candidate.qualifications.find((qualification) => {
    if (!qualification.is_active || qualification.currency_state !== "green") {
      return false;
    }

    if (qualification.operational_role_id !== requestRoleId) {
      return false;
    }

    if (requestAssetId && qualification.asset_id !== requestAssetId) {
      return false;
    }

    return true;
  });

  if (!matchingQualification) {
    return {
      status: "ineligible" as const,
      notes: ["No current green asset-role qualification matched this cover request."],
    };
  }

  if (matchingQualification.expires_on) {
    return {
      status: "eligible" as const,
      notes: ["A current green qualification with expiry date was found."],
    };
  }

  return {
    status: "eligible" as const,
    notes: ["A current green qualification was found."],
  };
}

export function evaluateCoverEligibility(candidate: CoverRequestCandidate | null, request: CoverRequestRecord): CoverRequestEligibility {
  if (!candidate) {
    return {
      status: "needs_admin_review",
      eligible: false,
      notes: ["No candidate record was available for review."],
    };
  }

  const notes: string[] = [];

  if (!candidate.profile.is_active) {
    return {
      status: "ineligible",
      eligible: false,
      notes: ["Profile is inactive."],
    };
  }

  if (!candidate.membership.is_active) {
    return {
      status: "ineligible",
      eligible: false,
      notes: ["Station membership is inactive."],
    };
  }

  if (candidate.profile.id === request.requester_profile_id) {
    return {
      status: "ineligible",
      eligible: false,
      notes: ["A crew member cannot accept their own cover request."],
    };
  }

  const roleMatch = getRoleMatchStatus(candidate, request);
  if (roleMatch.status === "ineligible") {
    return {
      status: "ineligible",
      eligible: false,
      notes: roleMatch.notes,
    };
  }

  const availabilityMatch = getAvailabilityStatus(candidate, request);
  if (availabilityMatch.status === "ineligible") {
    return {
      status: "ineligible",
      eligible: false,
      notes: availabilityMatch.notes,
    };
  }

  const dutyMatch = getDutyConflictStatus(candidate, request);
  if (dutyMatch.status === "ineligible") {
    return {
      status: "ineligible",
      eligible: false,
      notes: dutyMatch.notes,
    };
  }

  const requestEnd = parseDate(request.ends_at);
  if (!requestEnd) {
    return {
      status: "needs_admin_review",
      eligible: false,
      notes: ["The request window could not be evaluated."],
    };
  }

  const matchingQualification = candidate.qualifications.find((qualification) =>
    hasCurrentQualification(qualification, request, requestEnd),
  );

  if (!matchingQualification && (request.asset_id || request.operational_role_id)) {
    return {
      status: "needs_admin_review",
      eligible: false,
      notes: [
        ...roleMatch.notes,
        "No current green qualification could be confirmed for the requested asset and role.",
      ],
    };
  }

  if (!matchingQualification) {
    return {
      status: "needs_admin_review",
      eligible: false,
      notes: [...availabilityMatch.notes, ...dutyMatch.notes],
    };
  }

  notes.push(...roleMatch.notes, ...availabilityMatch.notes, ...dutyMatch.notes);

  return {
    status: "eligible",
    eligible: true,
    notes,
  };
}

function getLabel(profile: CoverRequestProfileRecord | null) {
  return profile?.display_name ?? profile?.email ?? profile?.id ?? "Unknown crew member";
}

function sortSummaryItems(items: CoverRequestSummaryItem[]) {
  return items.sort((a, b) => {
    if (a.request.urgency !== b.request.urgency) {
      return a.request.urgency === "urgent" ? -1 : 1;
    }

    return new Date(b.request.created_at).getTime() - new Date(a.request.created_at).getTime();
  });
}

async function loadCoverRequestRows(stationId: string | null) {
  const supabase = await createSupabaseServerClient();

  if (!stationId) {
    return {
      requests: [] as CoverRequestRecord[],
      responses: [] as CoverRequestResponseRecord[],
    };
  }

  const [requestResult, responseResult] = await Promise.all([
    supabase
      .from("cover_requests")
      .select(
        `
          id,
          station_id,
          requester_profile_id,
          original_duty_period_id,
          asset_id,
          operational_role_id,
          crew_type_id,
          cover_type,
          starts_at,
          ends_at,
          status,
          urgency,
          reason,
          notes,
          accepted_by_profile_id,
          accepted_at,
          resolved_at,
          created_at,
          updated_at
        `,
      )
      .eq("station_id", stationId)
      .order("urgency", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("cover_request_responses")
      .select(
        `
          id,
          cover_request_id,
          responder_profile_id,
          response_status,
          eligibility_status,
          eligibility_notes,
          notes,
          responded_at,
          created_at,
          updated_at
        `,
      )
      .order("created_at", { ascending: false }),
  ]);

  const requests = (requestResult.data ?? []) as CoverRequestRecord[];
  const responses = (responseResult.data ?? []) as CoverRequestResponseRecord[];
  const requesterIds = Array.from(
    new Set([
      ...requests.map((request) => request.requester_profile_id),
      ...requests.map((request) => request.accepted_by_profile_id).filter((value): value is string => Boolean(value)),
      ...responses.map((response) => response.responder_profile_id),
    ]),
  );
  const assetIds = Array.from(new Set(requests.map((request) => request.asset_id).filter((value): value is string => Boolean(value))));
  const roleIds = Array.from(
    new Set(requests.map((request) => request.operational_role_id).filter((value): value is string => Boolean(value))),
  );
  const dutyPeriodIds = Array.from(
    new Set(requests.map((request) => request.original_duty_period_id).filter((value): value is string => Boolean(value))),
  );
  const crewTypeIds = Array.from(new Set(requests.map((request) => request.crew_type_id).filter((value): value is string => Boolean(value))));

  const [profilesResult, assetsResult, rolesResult, crewTypesResult, dutyPeriodsResult] = await Promise.all([
    requesterIds.length
      ? supabase
          .from("profiles")
          .select("id, display_name, email, phone, system_role, is_active")
          .in("id", requesterIds)
      : Promise.resolve({ data: [] as CoverRequestProfileRecord[] }),
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
    roleIds.length
      ? supabase
          .from("operational_roles")
          .select("id, code, name, description, category, is_active")
          .in("id", roleIds)
      : Promise.resolve({ data: [] as OperationalRoleRecord[] }),
    crewTypeIds.length ? loadCrewTypes() : Promise.resolve([] as CoverRequestCrewTypeRecord[]),
    dutyPeriodIds.length
      ? supabase
          .from("duty_periods")
          .select(
            `
              id,
              station_id,
              profile_id,
              station_location_id,
              asset_type_id,
              asset_id,
              operational_role_id,
              period_kind,
              duty_date,
              start_time,
              end_time,
              starts_at,
              ends_at,
              source,
              notes,
              is_active,
              created_by_profile_id
            `,
          )
          .in("id", dutyPeriodIds)
      : Promise.resolve({ data: [] as CoverRequestDutyPeriodRecord[] }),
  ]);

  const profileMap = new Map<string, CoverRequestProfileRecord>();
  for (const profile of (profilesResult.data ?? []) as CoverRequestProfileRecord[]) {
    profileMap.set(profile.id, profile);
  }

  const assetMap = new Map<string, AssetRecord>();
  for (const asset of (assetsResult.data ?? []) as AssetRecord[]) {
    assetMap.set(asset.id, asset);
  }

  const roleMap = new Map<string, OperationalRoleRecord>();
  for (const role of (rolesResult.data ?? []) as OperationalRoleRecord[]) {
    roleMap.set(role.id, role);
  }

  const crewTypeMap = new Map<string, CoverRequestCrewTypeRecord>();
  for (const crewType of crewTypesResult as CoverRequestCrewTypeRecord[]) {
    crewTypeMap.set(crewType.id, crewType);
  }

  const dutyPeriodMap = new Map<string, CoverRequestDutyPeriodRecord>();
  for (const dutyPeriod of (dutyPeriodsResult.data ?? []) as CoverRequestDutyPeriodRecord[]) {
    dutyPeriodMap.set(dutyPeriod.id, dutyPeriod);
  }

  return {
    requests: requests.map((request) => ({
      ...request,
      requester: profileMap.get(request.requester_profile_id) ?? null,
      asset: request.asset_id ? assetMap.get(request.asset_id) ?? null : null,
      operational_role: request.operational_role_id ? roleMap.get(request.operational_role_id) ?? null : null,
      crew_type: request.crew_type_id ? crewTypeMap.get(request.crew_type_id) ?? null : null,
      original_duty_period: request.original_duty_period_id
        ? dutyPeriodMap.get(request.original_duty_period_id) ?? null
        : null,
      accepted_by_profile: request.accepted_by_profile_id
        ? profileMap.get(request.accepted_by_profile_id) ?? null
        : null,
    })),
    responses: responses.map((response) => ({
      ...response,
      responder: profileMap.get(response.responder_profile_id) ?? null,
      cover_request: requests.find((request) => request.id === response.cover_request_id) ?? null,
    })),
  };
}

function buildSummaryItem(
  request: CoverRequestRecord,
  responses: CoverRequestResponseRecord[],
  eligibleCrew: CoverRequestProfileRecord[] | null,
  currentCandidate: CoverRequestCandidate | null,
) {
  const requester = getFirstRecord(request.requester);
  const asset = getFirstRecord(request.asset);
  const role = getFirstRecord(request.operational_role);
  const crewType = getFirstRecord(request.crew_type);

  return {
    request,
    responses,
    requesterName: getLabel(requester),
    requestLabel: asset?.name ?? role?.name ?? crewType?.name ?? "General station cover",
    assetName: asset?.name ?? null,
    roleName: role?.name ?? null,
    crewTypeName: crewType?.name ?? null,
    eligibleCrewCount: eligibleCrew ? eligibleCrew.length : null,
    eligibleCrewNames: eligibleCrew ? eligibleCrew.map((profile) => getLabel(profile)) : [],
    myEligibility: currentCandidate ? evaluateCoverEligibility(currentCandidate, request) : null,
  } satisfies CoverRequestSummaryItem;
}

function getMembershipCandidate(
  membership: StationMembershipRecord,
  qualifications: CrewQualificationRecord[],
  availabilitySlots: AvailabilitySlotRecord[],
  dutyPeriods: DutyPeriodRecord[],
): CoverRequestCandidate | null {
  const profile = getFirstRecord(membership.profile);

  if (!profile) {
    return null;
  }

  return {
    profile,
    membership,
    qualifications: qualifications.filter((qualification) => qualification.profile_id === profile.id),
    availabilitySlots: availabilitySlots.filter((slot) => slot.profile_id === profile.id),
    dutyPeriods: dutyPeriods.filter((period) => period.profile_id === profile.id),
  };
}

async function loadCoverOverviewBase(pathname: string, requestedStationId: string | null) {
  noStore();
  const context = await requireRouteAccess(pathname);
  const stationOptions = buildStationOptionsFromContext(context);
  const selectedStationId =
    (requestedStationId && stationOptions.some((station) => station.id === requestedStationId)
      ? requestedStationId
      : null) ?? stationOptions[0]?.id ?? null;
  const selectedStation = stationOptions.find((station) => station.id === selectedStationId) ?? null;
  const { requests, responses } = await loadCoverRequestRows(selectedStationId);
  const responsesByRequestId = new Map<string, CoverRequestResponseRecord[]>();

  for (const response of responses) {
    const requestId = response.cover_request_id;
    const existing = responsesByRequestId.get(requestId) ?? [];
    responsesByRequestId.set(requestId, [...existing, response]);
  }

  return {
    context,
    stationOptions,
    selectedStationId,
    selectedStation,
    requests,
    responsesByRequestId,
  };
}

export async function loadCoverRequestOverview(pathname: string, requestedStationId: string | null) {
  const base = await loadCoverOverviewBase(pathname, requestedStationId);
  const openRequests = base.requests.filter((request) => request.status === "open");
  const summaryItems = sortSummaryItems(
    base.requests.map((request) =>
      buildSummaryItem(request, base.responsesByRequestId.get(request.id) ?? [], null, null),
    ),
  );

  return {
    ...base,
    requests: summaryItems,
    openCount: openRequests.length,
    urgentCount: base.requests.filter((request) => request.status === "open" && request.urgency === "urgent").length,
    acceptedCount: base.requests.filter((request) => request.status === "accepted").length,
    cancelledCount: base.requests.filter((request) => request.status === "cancelled").length,
    ownRequests: summaryItems.filter((item) => item.request.requester_profile_id === base.context.user?.id),
    debug:
      process.env.NODE_ENV === "production"
        ? null
        : {
            selectedStationId: base.selectedStationId,
            currentProfileId: base.context.user?.id ?? null,
            loadedCoverRequestCount: base.requests.length,
            visibleOpenRequestCount: summaryItems.filter((item) => item.request.status === "open").length,
          },
  } satisfies CoverRequestOverview;
}

export async function loadCrewCoverPageData(pathname: string, requestedStationId: string | null) {
  const overview = await loadCoverRequestOverview(pathname, requestedStationId);
  const crewContext = await loadCrewAvailabilityContext(pathname, overview.selectedStationId);
  const currentProfile = crewContext.context.profile;
  const supabase = await createSupabaseServerClient();
  let ownMembership: StationMembershipRecord | null = null;

  if (overview.selectedStationId && currentProfile?.id) {
    const { data } = await supabase
      .from("station_memberships")
      .select(
        `
          id,
          profile_id,
          station_id,
          crew_type_id,
          membership_role,
          is_primary,
          is_active,
          profile:profiles (
            id,
            display_name,
            email,
            phone,
            system_role,
            is_active
          )
        `,
      )
      .eq("station_id", overview.selectedStationId)
      .eq("profile_id", currentProfile.id)
      .eq("is_active", true)
      .maybeSingle();

    ownMembership = (data as StationMembershipRecord | null) ?? null;
  }

  const currentCandidate = ownMembership
    ? getMembershipCandidate(
        ownMembership,
        crewContext.crewQualifications,
        crewContext.availabilitySlots,
        crewContext.dutyPeriods,
      )
    : null;

  return {
    ...overview,
    crewTypes: await loadCrewTypes(),
    currentProfile,
    currentCandidate,
    ownMembership,
    availabilitySlots: crewContext.availabilitySlots,
    dutyPeriods: crewContext.dutyPeriods,
    crewQualifications: crewContext.crewQualifications,
    assets: crewContext.assets,
    operationalRoles: crewContext.operationalRoles,
    coverRequests: sortSummaryItems(
      overview.requests.map((item) => {
        const responseItems = overview.responsesByRequestId.get(item.request.id) ?? [];
        return buildSummaryItem(item.request, responseItems, null, currentCandidate);
      }),
    ),
    debug: overview.debug,
  } satisfies CoverRequestOverview & {
    currentProfile: CrewProfileRecord | null;
    currentCandidate: CoverRequestCandidate | null;
    ownMembership: StationMembershipRecord | null;
    crewTypes: CoverRequestCrewTypeRecord[];
    availabilitySlots: AvailabilitySlotRecord[];
    dutyPeriods: DutyPeriodRecord[];
    crewQualifications: CrewQualificationRecord[];
    assets: AssetRecord[];
    operationalRoles: OperationalRoleRecord[];
    coverRequests: CoverRequestSummaryItem[];
  };
}

export async function loadAdminCoverPageData(pathname: string, requestedStationId: string | null) {
  const { context } = await getAdminAccessContext(pathname);
  const stationContext = await resolveSelectedStationContext(context, requestedStationId);
  const selectedStationId = stationContext.selectedStationId;
  const overview = await loadCoverRequestOverview(pathname, selectedStationId);
  const adminContext = selectedStationId
    ? await loadAdminAvailabilityContext(pathname, selectedStationId)
    : null;
  const memberships = adminContext?.memberships ?? [];
  const availabilitySlots = adminContext?.availabilitySlots ?? [];
  const dutyPeriods = adminContext?.dutyPeriods ?? [];
  const crewQualifications = adminContext?.crewQualifications ?? [];
  const assets = adminContext?.assets ?? [];
  const operationalRoles = adminContext?.operationalRoles ?? [];
  const ownMembership =
    memberships.find((membership) => membership.profile_id === context.user?.id && membership.station_id === selectedStationId) ??
    null;

  const coverRequests = overview.requests.map((item) => {
    const eligibleCrew = selectedStationId
      ? memberships
          .map((membership) =>
            getMembershipCandidate(membership, crewQualifications, availabilitySlots, dutyPeriods),
          )
          .filter((candidate): candidate is CoverRequestCandidate => Boolean(candidate))
          .map((candidate) => ({
            candidate,
            eligibility: evaluateCoverEligibility(candidate, item.request),
          }))
          .filter((candidate) => candidate.eligibility.eligible)
          .map((candidate) => candidate.candidate.profile)
      : null;

    return buildSummaryItem(item.request, overview.responsesByRequestId.get(item.request.id) ?? [], eligibleCrew, null);
  });

  return {
    ...overview,
    ...adminContext,
    stationContext,
    crewTypes: await loadCrewTypes(),
    memberships,
    availabilitySlots,
    dutyPeriods,
    crewQualifications,
    assets,
    operationalRoles,
    ownMembership,
    coverRequests: sortSummaryItems(coverRequests),
    debug: overview.debug,
  } satisfies AdminCoverRequestData & {
    stationContext: SelectedStationContext;
    coverRequests: CoverRequestSummaryItem[];
  };
}

export async function loadCoverRequestDataForSummary(pathname: string, requestedStationId: string | null) {
  return loadCoverRequestOverview(pathname, requestedStationId);
}
