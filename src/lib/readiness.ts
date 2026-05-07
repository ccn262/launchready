import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRouteAccess, type CurrentUserContext } from "@/lib/auth";
import { buildCapabilityBadges } from "@/lib/capability-badges";
import {
  loadAdminAvailabilityContext,
  loadCrewAvailabilityContext,
  type AvailabilitySlotRecord,
  type DutyPeriodRecord,
} from "@/lib/phase6";
import type { AssetRecord, AssetTypeRecord, StationLocationRecord, StationOption } from "@/lib/admin-crud";
import type { CrewQualificationRecord, OperationalRoleRecord, StationMembershipRecord } from "@/lib/admin-phase5";

export type OperationType = "service" | "exercise" | "passage" | "boat_movement" | "assurance_activity";
export type ReadinessWindowPreset = "current" | "day" | "night" | "weekend" | "custom";
export type ReadinessStatus =
  | "launch_ready"
  | "degraded"
  | "delayed_launch_possible"
  | "not_launch_ready"
  | "off_service"
  | "non_sar_capable_exercise_only"
  | "unknown";
export type RequirementLevel = "hard_stop" | "required" | "preferred";

export type ReadinessWindow = Readonly<{
  key: ReadinessWindowPreset;
  label: string;
  startsAt: string;
  endsAt: string;
}>;

export type SafeCrewingRuleRecord = Readonly<{
  id: string;
  asset_type_id: string;
  operation_type: OperationType;
  minimum_crew: number;
  maximum_crew: number | null;
  darkness_minimum_crew: number | null;
  effective_from: string;
  effective_to: string | null;
  source_reference: string | null;
  notes: string | null;
}>;

export type SafeCrewingRoleRequirementRecord = Readonly<{
  id: string;
  asset_type_id: string;
  operation_type: OperationType;
  operational_role_id: string;
  required_count: number;
  requirement_level: RequirementLevel;
  effective_from: string;
  effective_to: string | null;
  notes: string | null;
}>;

export type AssetLaunchRecoveryRequirementRecord = Readonly<{
  id: string;
  asset_id: string;
  operational_role_id: string;
  required_count: number;
  requirement_level: RequirementLevel;
  notes: string | null;
}>;

type ProfileSummary = Readonly<{
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
}>;

type CrewCandidate = Readonly<{
  profile: ProfileSummary;
  membership: StationMembershipRecord;
  availability: AvailabilitySlotRecord[];
  qualifications: CrewQualificationRecord[];
}>;

type RequirementGap = Readonly<{
  id: string;
  label: string;
  severity: RequirementLevel;
  requiredCount: number;
  availableCount: number;
}>;

export type ReadinessAssetSummary = Readonly<{
  asset: AssetRecord;
  assetType: AssetTypeRecord | null;
  location: StationLocationRecord | null;
  rule: SafeCrewingRuleRecord | null;
  status: ReadinessStatus;
  statusLabel: string;
  availableCrewCount: number;
  minimumCrew: number;
  maximumCrew: number | null;
  currentCrew: CrewCandidate[];
  missingRoles: RequirementGap[];
  launchRecoveryGaps: RequirementGap[];
  preferredGaps: RequirementGap[];
  notes: string[];
  capabilityBadges: ReturnType<typeof buildCapabilityBadges>;
}>;

export type ReadinessLocationSummary = Readonly<{
  location: StationLocationRecord;
  status: ReadinessStatus;
  statusLabel: string;
  assetCount: number;
  assets: ReadinessAssetSummary[];
}>;

export type ReadinessStationSummary = Readonly<{
  stationName: string;
  stationId: string;
  operationType: OperationType;
  window: ReadinessWindow;
  status: ReadinessStatus;
  statusLabel: string;
  locationCount: number;
  assetCount: number;
  availableCrewCount: number;
  missingRoles: RequirementGap[];
  launchRecoveryGaps: RequirementGap[];
  currentDla: ProfileSummary | null;
  locations: ReadinessLocationSummary[];
}>;

export type ReadinessSnapshot = Readonly<{
  context: CurrentUserContext;
  scope: "station" | "personal";
  selectedStationId: string | null;
  selectedStation: StationOption | null;
  stationOptions: StationOption[];
  operationType: OperationType;
  window: ReadinessWindow;
  stationSummary: ReadinessStationSummary | null;
  personalSummary: {
    currentCapabilityBadges: ReturnType<typeof buildCapabilityBadges>;
    currentAvailabilityCount: number;
    assignedDutyCount: number;
    stationName: string | null;
  } | null;
  assetTypes: AssetTypeRecord[];
  locations: StationLocationRecord[];
  assets: AssetRecord[];
  operationalRoles: OperationalRoleRecord[];
  availabilitySlots: AvailabilitySlotRecord[];
  dutyPeriods: DutyPeriodRecord[];
  crewQualifications: CrewQualificationRecord[];
  rules: {
    safeCrewingRules: SafeCrewingRuleRecord[];
    roleRequirements: SafeCrewingRoleRequirementRecord[];
    launchRecoveryRequirements: AssetLaunchRecoveryRequirementRecord[];
  };
}>;

function getFirstRecord<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function asDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

function buildWindowFromPreset(preset: ReadinessWindowPreset, startsAtInput?: string | null, endsAtInput?: string | null): ReadinessWindow {
  const now = new Date();
  if (preset === "custom" && startsAtInput && endsAtInput) {
    const start = new Date(startsAtInput);
    const end = new Date(endsAtInput);
    if (isValidDate(start) && isValidDate(end)) {
      return {
        key: preset,
        label: `${formatDateTime(start)} to ${formatDateTime(end)}`,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      };
    }
  }

  if (preset === "day") {
    const start = startOfToday();
    start.setHours(7, 0, 0, 0);
    const end = new Date(start);
    end.setHours(19, 0, 0, 0);
    return {
      key: preset,
      label: "Day cover 07:00–19:00",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    };
  }

  if (preset === "night") {
    const start = startOfToday();
    start.setHours(19, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(7, 0, 0, 0);
    return {
      key: preset,
      label: "Night cover 19:00–07:00",
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
    };
  }

  if (preset === "weekend") {
    const friday = new Date(now);
    const daysUntilFriday = (5 - friday.getDay() + 7) % 7 || 7;
    friday.setDate(friday.getDate() + daysUntilFriday);
    friday.setHours(19, 0, 0, 0);
    const monday = new Date(friday);
    monday.setDate(friday.getDate() + 3);
    monday.setHours(7, 0, 0, 0);
    return {
      key: preset,
      label: "Weekend cover Fri 19:00–Mon 07:00",
      startsAt: friday.toISOString(),
      endsAt: monday.toISOString(),
    };
  }

  const start = new Date(now.getTime() - 30 * 1000);
  const end = new Date(now.getTime() + 30 * 1000);
  return {
    key: "current",
    label: `Current time ${formatDateTime(now)}`,
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  };
}

function overlapsWindow(rangeStart: Date, rangeEnd: Date, windowStart: Date, windowEnd: Date) {
  return rangeStart <= windowEnd && rangeEnd >= windowStart;
}

function getSlotRange(slot: AvailabilitySlotRecord) {
  const startsAt = slot.starts_at ? asDate(slot.starts_at) : null;
  const endsAt = slot.ends_at ? asDate(slot.ends_at) : null;
  if (startsAt && endsAt && isValidDate(startsAt) && isValidDate(endsAt)) {
    return { startsAt, endsAt };
  }

  if (slot.coverage_date) {
    const date = new Date(`${slot.coverage_date}T00:00:00`);
    const start = new Date(date);
    const end = new Date(date);
    const [startHour, startMinute] = slot.start_time.split(":").map(Number);
    const [endHour, endMinute] = slot.end_time.split(":").map(Number);
    start.setHours(startHour, startMinute, 0, 0);
    end.setHours(endHour, endMinute, 0, 0);
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }
    return { startsAt: start, endsAt: end };
  }

  return null;
}

function getDutyRange(period: DutyPeriodRecord) {
  const startsAt = period.starts_at ? asDate(period.starts_at) : null;
  const endsAt = period.ends_at ? asDate(period.ends_at) : null;
  if (startsAt && endsAt && isValidDate(startsAt) && isValidDate(endsAt)) {
    return { startsAt, endsAt };
  }

  const date = new Date(`${period.duty_date}T00:00:00`);
  const start = new Date(date);
  const end = new Date(date);
  const [startHour, startMinute] = period.start_time.split(":").map(Number);
  const [endHour, endMinute] = period.end_time.split(":").map(Number);
  start.setHours(startHour, startMinute, 0, 0);
  end.setHours(endHour, endMinute, 0, 0);
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  return { startsAt: start, endsAt: end };
}

function isAvailabilityPositive(slot: AvailabilitySlotRecord) {
  return slot.is_active && slot.slot_kind !== "unavailable" && slot.slot_kind !== "weekend_unavailable";
}

function isAvailabilityNegative(slot: AvailabilitySlotRecord) {
  return slot.is_active && (slot.slot_kind === "unavailable" || slot.slot_kind === "weekend_unavailable");
}

function isQualificationCurrent(qualification: CrewQualificationRecord, windowStart: Date) {
  if (!qualification.is_active) {
    return false;
  }

  if (!qualification.expires_on) {
    return true;
  }

  const expiry = new Date(`${qualification.expires_on}T23:59:59`);
  return isValidDate(expiry) && expiry >= windowStart;
}

function getRequirementLabel(assetTypeName: string | null, roleName: string | null) {
  const assetLabel = assetTypeName ?? "Asset";
  const roleLabel = roleName ?? "Role";
  return `Missing ${assetLabel} ${roleLabel}`;
}

function getStatusRank(status: ReadinessStatus) {
  switch (status) {
    case "launch_ready":
      return 5;
    case "degraded":
      return 4;
    case "delayed_launch_possible":
      return 3;
    case "not_launch_ready":
      return 2;
    case "non_sar_capable_exercise_only":
      return 1;
    case "unknown":
      return 0;
    case "off_service":
      return -1;
  }
}

function worstStatus(statuses: ReadinessStatus[]) {
  return statuses.sort((a, b) => getStatusRank(a) - getStatusRank(b))[0] ?? "unknown";
}

function getAssetTypeById(assetTypes: AssetTypeRecord[], assetTypeId: string | null) {
  return assetTypes.find((item) => item.id === assetTypeId) ?? null;
}

function getLocationById(locations: StationLocationRecord[], locationId: string | null) {
  return locations.find((item) => item.id === locationId) ?? null;
}

function getRoleById(roles: OperationalRoleRecord[], roleId: string | null) {
  return roles.find((item) => item.id === roleId) ?? null;
}

function getAssetCandidatesForCrew(
  crew: CrewCandidate[],
  asset: AssetRecord,
  windowStart: Date,
  windowEnd: Date,
) {
  return crew.filter((member) => {
    const hasPositiveAvailability = member.availability.some((slot) => {
      const range = getSlotRange(slot);
      if (!range) {
        return false;
      }

      return isAvailabilityPositive(slot) && overlapsWindow(range.startsAt, range.endsAt, windowStart, windowEnd);
    });

    const hasNegativeAvailability = member.availability.some((slot) => {
      const range = getSlotRange(slot);
      if (!range) {
        return false;
      }

      return isAvailabilityNegative(slot) && overlapsWindow(range.startsAt, range.endsAt, windowStart, windowEnd);
    });

    if (!hasPositiveAvailability || hasNegativeAvailability) {
      return false;
    }

    return member.qualifications.some((qualification) => {
      if (!isQualificationCurrent(qualification, windowStart)) {
        return false;
      }

      if (qualification.currency_state !== "green") {
        return false;
      }

      if (qualification.asset_id === asset.id) {
        return true;
      }

      return Boolean(qualification.asset_type_id && qualification.asset_type_id === asset.asset_type_id);
    });
  });
}

function getMatchingAssignments(
  crew: CrewCandidate[],
  asset: AssetRecord,
  roleId: string,
  windowStart: Date,
) {
  return crew.filter((member) =>
    member.qualifications.some((qualification) => {
      if (!isQualificationCurrent(qualification, windowStart)) {
        return false;
      }

      if (qualification.currency_state !== "green") {
        return false;
      }

      if (qualification.operational_role_id !== roleId) {
        return false;
      }

      if (qualification.asset_id === asset.id) {
        return true;
      }

      return Boolean(qualification.asset_type_id && qualification.asset_type_id === asset.asset_type_id);
    }),
  );
}

function toRequirementGap(
  requirement: { id: string; required_count: number; requirement_level: RequirementLevel; operational_role_id: string },
  availableCount: number,
  role: OperationalRoleRecord | null,
  assetType: AssetTypeRecord | null,
) {
  return {
    id: requirement.id,
    label: getRequirementLabel(assetType?.name ?? null, role?.name ?? null),
    severity: requirement.requirement_level,
    requiredCount: requirement.required_count,
    availableCount,
  } satisfies RequirementGap;
}

function aggregateAssetStatus(params: {
  rule: SafeCrewingRuleRecord | null;
  roleRequirements: SafeCrewingRoleRequirementRecord[];
  launchRecoveryRequirements: AssetLaunchRecoveryRequirementRecord[];
  candidates: CrewCandidate[];
  asset: AssetRecord;
  assetType: AssetTypeRecord | null;
  roles: OperationalRoleRecord[];
  windowStart: Date;
  windowEnd: Date;
  operationType: OperationType;
}) {
  const {
    rule,
    roleRequirements,
    launchRecoveryRequirements,
    candidates,
    asset,
    assetType,
    roles,
    windowStart,
    windowEnd,
    operationType,
  } = params;

  if (!asset.is_active || asset.status === "off_service") {
    return {
      rule,
      status: "off_service" as ReadinessStatus,
      statusLabel: "Off service",
      availableCrewCount: 0,
      minimumCrew: rule?.minimum_crew ?? 0,
      maximumCrew: rule?.maximum_crew ?? null,
      missingRoles: [] as RequirementGap[],
      launchRecoveryGaps: [] as RequirementGap[],
      preferredGaps: [] as RequirementGap[],
      notes: ["Asset is marked inactive or off service."],
      currentCrew: [] as CrewCandidate[],
      capabilityBadges: [] as ReturnType<typeof buildCapabilityBadges>,
    };
  }

  if (!rule) {
    return {
      rule: null,
      status: "unknown" as ReadinessStatus,
      statusLabel: "No readiness rule configured",
      availableCrewCount: 0,
      minimumCrew: 0,
      maximumCrew: null,
      missingRoles: [] as RequirementGap[],
      launchRecoveryGaps: [] as RequirementGap[],
      preferredGaps: [] as RequirementGap[],
      notes: [`No safe-crewing rule exists for ${assetType?.name ?? asset.name} (${operationType}).`],
      currentCrew: [] as CrewCandidate[],
      capabilityBadges: [] as ReturnType<typeof buildCapabilityBadges>,
    };
  }

  const currentCrew = getAssetCandidatesForCrew(candidates, asset, windowStart, windowEnd);
  const matchingRoleRequirements = roleRequirements.filter((requirement) => requirement.asset_type_id === asset.asset_type_id);
  const matchingLaunchRecovery = launchRecoveryRequirements.filter((requirement) => requirement.asset_id === asset.id);

  const missingRoles: RequirementGap[] = [];
  const launchRecoveryGaps: RequirementGap[] = [];
  const preferredGaps: RequirementGap[] = [];

  for (const requirement of matchingRoleRequirements) {
    const role = getRoleById(roles, requirement.operational_role_id);
    const availableCount = getMatchingAssignments(currentCrew, asset, requirement.operational_role_id, windowStart).length;
    if (availableCount < requirement.required_count) {
      const gap = toRequirementGap(requirement, availableCount, role, assetType);
      if (requirement.requirement_level === "preferred") {
        preferredGaps.push(gap);
      } else {
        missingRoles.push(gap);
      }
    }
  }

  for (const requirement of matchingLaunchRecovery) {
    const role = getRoleById(roles, requirement.operational_role_id);
    const availableCount = getMatchingAssignments(currentCrew, asset, requirement.operational_role_id, windowStart).length;
    if (availableCount < requirement.required_count) {
      const gap = toRequirementGap(requirement, availableCount, role, assetType);
      if (requirement.requirement_level === "preferred") {
        preferredGaps.push(gap);
      } else {
        launchRecoveryGaps.push(gap);
      }
    }
  }

  const availableCrewCount = currentCrew.length;
  const currentCrewBadgeRows = currentCrew.flatMap((member) =>
    member.qualifications.filter((qualification) => {
      if (!isQualificationCurrent(qualification, windowStart)) {
        return false;
      }

      if (qualification.currency_state !== "green") {
        return false;
      }

      if (qualification.asset_id === asset.id) {
        return true;
      }

      return Boolean(qualification.asset_type_id && qualification.asset_type_id === asset.asset_type_id);
    }),
  );
  const capabilityBadges = buildCapabilityBadges(currentCrewBadgeRows);

  const hasHardStopGaps = missingRoles.some((gap) => gap.severity === "hard_stop") || launchRecoveryGaps.some((gap) => gap.severity === "hard_stop");
  const hasRequiredGaps = missingRoles.some((gap) => gap.severity === "required") || launchRecoveryGaps.some((gap) => gap.severity === "required");
  const hasPreferredGaps = preferredGaps.length > 0;
  const belowMinimumCrew = availableCrewCount < rule.minimum_crew;
  const aboveMaximumCrew = rule.maximum_crew !== null && availableCrewCount > rule.maximum_crew;

  let status: ReadinessStatus = "launch_ready";
  let statusLabel = "Launch ready";

  if (hasHardStopGaps || belowMinimumCrew) {
    status = "not_launch_ready";
    statusLabel = hasHardStopGaps ? "Not launch ready" : "Below minimum crew";
  } else if (hasRequiredGaps) {
    status = "delayed_launch_possible";
    statusLabel = "Delayed launch possible";
  } else if (hasPreferredGaps || aboveMaximumCrew) {
    status = "degraded";
    statusLabel = aboveMaximumCrew ? "Crew above recommended maximum" : "Degraded";
  }

  return {
    rule,
    status,
    statusLabel,
    availableCrewCount,
    minimumCrew: rule.minimum_crew,
    maximumCrew: rule.maximum_crew,
    missingRoles,
    launchRecoveryGaps,
    preferredGaps,
    notes: [
      rule.source_reference ? `Source: ${rule.source_reference}` : null,
      rule.notes ?? null,
    ].filter((value): value is string => Boolean(value)),
    currentCrew,
    capabilityBadges,
  };
}

function buildCrewCandidates(
  memberships: StationMembershipRecord[],
  availabilitySlots: AvailabilitySlotRecord[],
  crewQualifications: CrewQualificationRecord[],
): CrewCandidate[] {
  return memberships
    .filter((membership) => membership.is_active)
    .map((membership) => {
      const profile = getFirstRecord(membership.profile);
      if (!profile || !profile.is_active) {
        return null;
      }

      const memberAvailability = availabilitySlots.filter((slot) => slot.profile_id === membership.profile_id && slot.is_active);
      const memberQualifications = crewQualifications.filter((qualification) => qualification.profile_id === membership.profile_id && qualification.is_active);

      return {
        profile: {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          phone: profile.phone,
        },
        membership,
        availability: memberAvailability,
        qualifications: memberQualifications,
      } satisfies CrewCandidate;
    })
    .filter((candidate): candidate is CrewCandidate => Boolean(candidate));
}

async function loadRulesForStation(assetIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const [{ data: safeCrewingRules }, { data: roleRequirements }, { data: launchRecoveryRequirements }] = await Promise.all([
    supabase
      .from("safe_crewing_rules")
      .select(
        "id, asset_type_id, operation_type, minimum_crew, maximum_crew, darkness_minimum_crew, effective_from, effective_to, source_reference, notes",
      )
      .order("effective_from", { ascending: false }),
    supabase
      .from("safe_crewing_role_requirements")
      .select(
        "id, asset_type_id, operation_type, operational_role_id, required_count, requirement_level, effective_from, effective_to, notes",
      )
      .order("effective_from", { ascending: false }),
    assetIds.length
      ? supabase
          .from("asset_launch_recovery_requirements")
          .select("id, asset_id, operational_role_id, required_count, requirement_level, notes")
          .in("asset_id", assetIds)
      : Promise.resolve({ data: [] }),
  ]);

  return {
    safeCrewingRules: (safeCrewingRules ?? []) as SafeCrewingRuleRecord[],
    roleRequirements: (roleRequirements ?? []) as SafeCrewingRoleRequirementRecord[],
    launchRecoveryRequirements: (launchRecoveryRequirements ?? []) as AssetLaunchRecoveryRequirementRecord[],
  };
}

function filterRulesByAssetTypeAndDate<T extends { asset_type_id: string; effective_from: string; effective_to: string | null }>(
  rules: T[],
  assetTypeId: string,
  windowStart: Date,
) {
  return rules
    .filter((rule) => rule.asset_type_id === assetTypeId)
    .filter((rule) => {
      const from = new Date(`${rule.effective_from}T00:00:00`);
      const to = rule.effective_to ? new Date(`${rule.effective_to}T23:59:59`) : null;
      return from <= windowStart && (!to || to >= windowStart);
    })
    .sort((a, b) => new Date(`${b.effective_from}T00:00:00`).getTime() - new Date(`${a.effective_from}T00:00:00`).getTime());
}

function pickRuleByOperation<T extends { operation_type: OperationType }>(rules: T[], operationType: OperationType) {
  return rules.find((rule) => rule.operation_type === operationType) ?? rules.find((rule) => rule.operation_type === "service") ?? null;
}

function pickRequirementRowsByOperation<T extends { operation_type: OperationType }>(rules: T[], operationType: OperationType) {
  const directMatches = rules.filter((rule) => rule.operation_type === operationType);
  return directMatches.length ? directMatches : rules.filter((rule) => rule.operation_type === "service");
}

function resolvePersonalSummary(
  context: CurrentUserContext,
  availabilitySlots: AvailabilitySlotRecord[],
  dutyPeriods: DutyPeriodRecord[],
  crewQualifications: CrewQualificationRecord[],
  selectedStation: StationOption | null,
) {
  const currentCapabilityBadges = buildCapabilityBadges(
    crewQualifications.filter((qualification) => qualification.asset_id || qualification.asset_type_id || qualification.operational_role_id),
  );
  return {
    currentCapabilityBadges,
    currentAvailabilityCount: availabilitySlots.filter((slot) => slot.is_active).length,
    assignedDutyCount: dutyPeriods.filter((period) => period.is_active).length,
    stationName: selectedStation?.name ?? context.primaryStationName ?? null,
  };
}

export async function loadReadinessSnapshot({
  pathname,
  requestedStationId,
  operationType = "service",
  windowPreset = "current",
  customStartsAt,
  customEndsAt,
}: Readonly<{
  pathname: string;
  requestedStationId: string | null;
  operationType?: OperationType;
  windowPreset?: ReadinessWindowPreset;
  customStartsAt?: string | null;
  customEndsAt?: string | null;
}>): Promise<ReadinessSnapshot> {
  const context = await requireRouteAccess(pathname);
  const isStationWide = context.isSuperAdmin || context.canAccessDla || context.canAccessAdmin;
  const window = buildWindowFromPreset(windowPreset, customStartsAt, customEndsAt);

  if (isStationWide) {
    const stationContext = await loadAdminAvailabilityContext(pathname, requestedStationId);
    const rules = await loadRulesForStation(stationContext.assets.map((asset) => asset.id));
    const crew = buildCrewCandidates(
      stationContext.memberships,
      stationContext.availabilitySlots,
      stationContext.crewQualifications,
    );
    const windowStart = asDate(window.startsAt);
    const windowEnd = asDate(window.endsAt);

    const assets = stationContext.assets.map((asset) => {
      const assetType = getAssetTypeById(stationContext.assetTypes, asset.asset_type_id);
      const matchingRules = filterRulesByAssetTypeAndDate(
        rules.safeCrewingRules,
        asset.asset_type_id,
        windowStart,
      );
      const rule = pickRuleByOperation(matchingRules, operationType) as SafeCrewingRuleRecord | null;
      const matchingRoleRequirements = filterRulesByAssetTypeAndDate(
        rules.roleRequirements,
        asset.asset_type_id,
        windowStart,
      );
      const roleRequirements = pickRequirementRowsByOperation(matchingRoleRequirements, operationType) as SafeCrewingRoleRequirementRecord[];
      const launchRecoveryRequirements = rules.launchRecoveryRequirements.filter((row) => row.asset_id === asset.id);
      const candidates = getAssetCandidatesForCrew(crew, asset, windowStart, windowEnd);
      const assetSummary = aggregateAssetStatus({
        rule,
        roleRequirements,
        launchRecoveryRequirements,
        candidates,
        asset,
        assetType,
        roles: stationContext.operationalRoles,
        windowStart,
        windowEnd,
        operationType,
      });

      return {
        ...assetSummary,
        asset,
        assetType,
        location: getLocationById(stationContext.locations, asset.station_location_id),
      } satisfies ReadinessAssetSummary;
    });

    const locations: ReadinessLocationSummary[] = stationContext.locations.map((location) => {
      const locationAssets = assets.filter((asset) => asset.location?.id === location.id);
      const status = worstStatus(locationAssets.map((asset) => asset.status));
      return {
        location,
        status,
        statusLabel:
          status === "launch_ready"
            ? "Launch ready"
            : status === "degraded"
              ? "Degraded"
              : status === "delayed_launch_possible"
                ? "Delayed launch possible"
                : status === "not_launch_ready"
                  ? "Not launch ready"
                  : status === "off_service"
                    ? "Off service"
                    : "Unknown",
        assetCount: locationAssets.length,
        assets: locationAssets,
      };
    });

    const overallStatus = worstStatus(assets.map((asset) => asset.status));
    const currentDlaDuty = stationContext.dutyPeriods.find((period) => {
      const range = getDutyRange(period);
      if (!range) {
        return false;
      }

      return (
        period.is_active &&
        (period.period_kind === "dla_day" || period.period_kind === "dla_night") &&
        overlapsWindow(range.startsAt, range.endsAt, windowStart, asDate(window.endsAt))
      );
    });

    const currentDla = currentDlaDuty
      ? {
          id: currentDlaDuty.profile?.id ?? "unknown",
          display_name: getFirstRecord(currentDlaDuty.profile)?.display_name ?? null,
          email: getFirstRecord(currentDlaDuty.profile)?.email ?? null,
          phone: getFirstRecord(currentDlaDuty.profile)?.phone ?? null,
        }
      : null;

    const summary: ReadinessStationSummary = {
      stationName: stationContext.selectedStation?.name ?? "Unknown station",
      stationId: stationContext.selectedStationId ?? "",
      operationType,
      window,
      status: overallStatus,
      statusLabel:
        overallStatus === "launch_ready"
          ? "Launch ready"
          : overallStatus === "degraded"
            ? "Degraded"
            : overallStatus === "delayed_launch_possible"
              ? "Delayed launch possible"
              : overallStatus === "not_launch_ready"
                ? "Not launch ready"
                : overallStatus === "off_service"
                  ? "Off service"
                  : "Unknown",
      locationCount: locations.length,
      assetCount: assets.length,
      availableCrewCount: crew.length,
      missingRoles: assets.flatMap((asset) => asset.missingRoles),
      launchRecoveryGaps: assets.flatMap((asset) => asset.launchRecoveryGaps),
      currentDla,
      locations,
    };

    return {
      context: stationContext.context,
      scope: "station",
      selectedStationId: stationContext.selectedStationId,
      selectedStation: stationContext.selectedStation,
      stationOptions: stationContext.stationOptions,
      operationType,
      window,
      stationSummary: summary,
      personalSummary: null,
      assetTypes: stationContext.assetTypes,
      locations: stationContext.locations,
      assets: stationContext.assets,
      operationalRoles: stationContext.operationalRoles,
      availabilitySlots: stationContext.availabilitySlots,
      dutyPeriods: stationContext.dutyPeriods,
      crewQualifications: stationContext.crewQualifications,
      rules,
    };
  }

  const crewContext = await loadCrewAvailabilityContext(pathname, requestedStationId);
  const personalSummary = resolvePersonalSummary(
    crewContext.context,
    crewContext.availabilitySlots,
    crewContext.dutyPeriods,
    crewContext.crewQualifications,
    crewContext.selectedStation,
  );

  return {
    context: crewContext.context,
    scope: "personal",
    selectedStationId: crewContext.selectedStationId,
    selectedStation: crewContext.selectedStation,
    stationOptions: crewContext.stationOptions,
    operationType,
    window,
    stationSummary: null,
    personalSummary,
    assetTypes: crewContext.assetTypes,
    locations: crewContext.locations,
    assets: crewContext.assets,
    operationalRoles: crewContext.operationalRoles,
    availabilitySlots: crewContext.availabilitySlots,
    dutyPeriods: crewContext.dutyPeriods,
    crewQualifications: crewContext.crewQualifications,
    rules: {
      safeCrewingRules: [],
      roleRequirements: [],
      launchRecoveryRequirements: [],
    },
  };
}
