import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRouteAccess, type CurrentUserContext } from "@/lib/auth";
import {
  buildCapabilityBadges,
  buildCapabilityBadgeLabel,
  getAssetShortCode,
  getBadgeTone,
  getRoleShortCode,
} from "@/lib/capability-badges";
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
  operationalRoleId: string;
  assetTypeId: string | null;
  bucket: "boat" | "launch_recovery" | "shore";
}>;

type AllocationTone = "green" | "amber" | "red" | "grey";

export type AdvisoryAllocationCrew = Readonly<{
  profile: ProfileSummary;
  membershipRole: StationMembershipRecord["membership_role"];
  badge: Readonly<{
    id: string;
    label: string;
    assetLabel: string;
    roleLabel: string;
    tone: AllocationTone;
  }>;
  roleName: string;
  source: "exact_asset" | "asset_type" | "general";
  notes: string[];
}>;

export type HeadLauncherAdvisory = Readonly<{
  status: "missing" | "available" | "conflict_boat_crew" | "conflict_launch_authority";
  label: string;
  crew: AdvisoryAllocationCrew[];
  notes: string[];
}>;

export type AdvisoryAllocationSummary = Readonly<{
  likelyBoatCrew: AdvisoryAllocationCrew[];
  likelyLaunchRecoveryCrew: AdvisoryAllocationCrew[];
  likelyShoreSupportCrew: AdvisoryAllocationCrew[];
  missingHardStopRoles: RequirementGap[];
  missingRequiredRoles: RequirementGap[];
  preferredGaps: RequirementGap[];
  roleConflicts: string[];
  crewWhoCouldRestoreReadiness: ProfileSummary[];
  headLauncher: HeadLauncherAdvisory;
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
  missingHardStopRoles: RequirementGap[];
  missingRequiredRoles: RequirementGap[];
  launchRecoveryGaps: RequirementGap[];
  preferredGaps: RequirementGap[];
  likelyBoatCrew: AdvisoryAllocationCrew[];
  likelyLaunchRecoveryCrew: AdvisoryAllocationCrew[];
  likelyShoreSupportCrew: AdvisoryAllocationCrew[];
  roleConflicts: string[];
  crewWhoCouldRestoreReadiness: ProfileSummary[];
  headLauncher: HeadLauncherAdvisory;
  allocation: AdvisoryAllocationSummary;
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

function toRequirementGap(
  requirement: { id: string; required_count: number; requirement_level: RequirementLevel; operational_role_id: string },
  availableCount: number,
  role: OperationalRoleRecord | null,
  assetType: AssetTypeRecord | null,
  bucket: "boat" | "launch_recovery" | "shore",
) {
  return {
    id: requirement.id,
    label: getRequirementLabel(assetType?.name ?? null, role?.name ?? null),
    severity: requirement.requirement_level,
    requiredCount: requirement.required_count,
    availableCount,
    operationalRoleId: requirement.operational_role_id,
    assetTypeId: assetType?.id ?? null,
    bucket,
  } satisfies RequirementGap;
}

type AllocationBucket = RequirementGap["bucket"];

type AllocationRequirementSpec = Readonly<{
  requirement: RequirementGap;
  role: OperationalRoleRecord | null;
  bucket: AllocationBucket;
  priority: number;
}>;

type AllocationMatch = Readonly<{
  candidate: CrewCandidate;
  qualification: CrewQualificationRecord;
  role: OperationalRoleRecord;
  source: "exact_asset" | "asset_type";
  score: number;
  requirementLabel: string;
  roleLabel: string;
  bucket: AllocationBucket;
}>;

function getRoleByCode(roles: OperationalRoleRecord[], code: string) {
  return roles.find((role) => role.code === code) ?? null;
}

function getRequirementBucket(role: OperationalRoleRecord | null, fallback: AllocationBucket = "boat"): AllocationBucket {
  if (!role) {
    return fallback;
  }

  if (role.category === "launch_recovery") {
    return "launch_recovery";
  }

  if (role.code === "shore_crew") {
    return "shore";
  }

  return "boat";
}

function getRolePriority(role: OperationalRoleRecord, requirementCode: string | null) {
  if (requirementCode && role.code === requirementCode) {
    return 100;
  }

  if (requirementCode === "boat_crew") {
    if (role.code === "helm" || role.code === "pilot" || role.code === "navigator" || role.code === "commander") {
      return 90;
    }
    if (role.code === "tier_2") {
      return 80;
    }
    if (role.code === "tier_1" || role.code === "boat_crew") {
      return 75;
    }
    if (role.category === "support") {
      return 60;
    }
    return 50;
  }

  if (requirementCode === "shore_crew") {
    if (role.code === "shore_crew") {
      return 100;
    }
    if (role.category === "support") {
      return 80;
    }
    return 0;
  }

  return role.category === "operational" ? 70 : 40;
}

function isQualificationRelevantToAsset(qualification: CrewQualificationRecord, asset: AssetRecord) {
  if (qualification.asset_id === asset.id) {
    return true;
  }

  return Boolean(qualification.asset_type_id && qualification.asset_type_id === asset.asset_type_id);
}

function isQualificationCurrentGreenForAsset(qualification: CrewQualificationRecord, asset: AssetRecord, windowStart: Date) {
  return isQualificationCurrent(qualification, windowStart) && qualification.currency_state === "green" && isQualificationRelevantToAsset(qualification, asset);
}

function isRoleEligibleForRequirement(role: OperationalRoleRecord, requirementRoleCode: string | null, bucket: AllocationBucket) {
  if (requirementRoleCode && role.code === requirementRoleCode) {
    return true;
  }

  if (bucket === "launch_recovery") {
    return false;
  }

  if (bucket === "shore") {
    return role.code === "shore_crew" || role.category === "support";
  }

  if (requirementRoleCode === "boat_crew") {
    return role.category === "operational" || role.category === "support";
  }

  if (requirementRoleCode === "shore_crew") {
    return role.code === "shore_crew" || role.category === "support";
  }

  return false;
}

function getQualificationSource(qualification: CrewQualificationRecord, asset: AssetRecord) {
  return qualification.asset_id === asset.id ? ("exact_asset" as const) : ("asset_type" as const);
}

function buildCandidateAllocationMatch(
  candidate: CrewCandidate,
  asset: AssetRecord,
  roles: OperationalRoleRecord[],
  requirement: RequirementGap,
  requirementRole: OperationalRoleRecord | null,
  windowStart: Date,
) {
  const requirementRoleCode = requirementRole?.code ?? null;
  let bestMatch: AllocationMatch | null = null;

  for (const qualification of candidate.qualifications) {
    if (!isQualificationCurrentGreenForAsset(qualification, asset, windowStart)) {
      continue;
    }

    const candidateRole = getRoleById(roles, qualification.operational_role_id);
    if (!candidateRole) {
      continue;
    }

    if (!isRoleEligibleForRequirement(candidateRole, requirementRoleCode, requirement.bucket)) {
      continue;
    }

    const source = getQualificationSource(qualification, asset);
    const score = (source === "exact_asset" ? 100 : 80) + getRolePriority(candidateRole, requirementRoleCode);
    const match: AllocationMatch = {
      candidate,
      qualification,
      role: candidateRole,
      source,
      score,
      requirementLabel: requirement.label,
      roleLabel: candidateRole.name,
      bucket: requirement.bucket,
    };

    if (!bestMatch || match.score > bestMatch.score) {
      bestMatch = match;
    }
  }

  return bestMatch;
}

function buildRequirementMatches(
  candidates: CrewCandidate[],
  asset: AssetRecord,
  roles: OperationalRoleRecord[],
  requirement: RequirementGap,
  requirementRole: OperationalRoleRecord | null,
  windowStart: Date,
) {
  return candidates
    .map((candidate) => buildCandidateAllocationMatch(candidate, asset, roles, requirement, requirementRole, windowStart))
    .filter((match): match is AllocationMatch => Boolean(match))
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      const aName = a.candidate.profile.display_name ?? a.candidate.profile.email ?? a.candidate.profile.id;
      const bName = b.candidate.profile.display_name ?? b.candidate.profile.email ?? b.candidate.profile.id;
      return aName.localeCompare(bName);
    });
}

function buildAllocationCrew(match: AllocationMatch, assetType: AssetTypeRecord | null): AdvisoryAllocationCrew {
  return {
    profile: match.candidate.profile,
    membershipRole: match.candidate.membership.membership_role,
    badge: {
      id: match.qualification.id,
      label: buildCapabilityBadgeLabel(
        getAssetShortCode(assetType?.code, assetType?.name),
        getRoleShortCode(match.role.code, match.role.name),
      ),
      assetLabel: getAssetShortCode(assetType?.code, assetType?.name),
      roleLabel: getRoleShortCode(match.role.code, match.role.name),
      tone: getBadgeTone(match.qualification.currency_state, match.qualification.is_active),
    },
    roleName: match.role.name,
    source: match.source,
    notes: [
      match.source === "exact_asset" ? "Exact asset qualification." : "Asset type qualification.",
      match.qualification.notes ?? null,
    ].filter((value): value is string => Boolean(value)),
  };
}

function buildAllocationSummary(params: {
  candidates: CrewCandidate[];
  asset: AssetRecord;
  assetType: AssetTypeRecord | null;
  roleRequirements: SafeCrewingRoleRequirementRecord[];
  launchRecoveryRequirements: AssetLaunchRecoveryRequirementRecord[];
  roles: OperationalRoleRecord[];
  windowStart: Date;
  currentDlaProfileId: string | null;
}) {
  const {
    candidates,
    asset,
    assetType,
    roleRequirements,
    launchRecoveryRequirements,
    roles,
    windowStart,
    currentDlaProfileId,
  } = params;

  const usedProfileIds = new Set<string>();
  const selectedByProfileId = new Map<string, string>();
  const roleConflicts = new Set<string>();
  const restoreReadyCrew = new Map<string, ProfileSummary>();
  const likelyBoatCrew: AdvisoryAllocationCrew[] = [];
  const likelyLaunchRecoveryCrew: AdvisoryAllocationCrew[] = [];
  const likelyShoreSupportCrew: AdvisoryAllocationCrew[] = [];
  const missingHardStopRoles: RequirementGap[] = [];
  const missingRequiredRoles: RequirementGap[] = [];
  const preferredGaps: RequirementGap[] = [];

  const headLauncherRole = getRoleByCode(roles, "head_launcher");
  let headLauncherStatus: HeadLauncherAdvisory["status"] = headLauncherRole ? "available" : "missing";
  let headLauncherLabel = headLauncherRole ? "Head Launcher available" : "Missing Head Launcher";
  let headLauncherCrew: AdvisoryAllocationCrew[] = [];
  const headLauncherNotes: string[] = headLauncherRole ? [] : ["Head Launcher role is not yet configured in operational roles."];

  const allocationSpecs: AllocationRequirementSpec[] = [
    ...roleRequirements.map((requirement) => {
      const role = getRoleById(roles, requirement.operational_role_id);
      const bucket = getRequirementBucket(role, "boat");
      return {
        requirement: toRequirementGap(requirement, 0, role, assetType, bucket),
        role,
        bucket,
        priority: requirement.requirement_level === "hard_stop" ? 0 : requirement.requirement_level === "required" ? 1 : 2,
      };
    }),
    ...launchRecoveryRequirements.map((requirement) => {
      const role = getRoleById(roles, requirement.operational_role_id);
      return {
        requirement: {
          id: requirement.id,
          label: getRequirementLabel(assetType?.name ?? null, role?.name ?? null),
          severity: requirement.requirement_level,
          requiredCount: requirement.required_count,
          availableCount: 0,
          operationalRoleId: requirement.operational_role_id,
          assetTypeId: assetType?.id ?? null,
          bucket: "launch_recovery" as const,
        },
        role,
        bucket: "launch_recovery" as const,
        priority: requirement.requirement_level === "hard_stop" ? 0 : requirement.requirement_level === "required" ? 1 : 2,
      };
    }),
  ].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    const aMatches = buildRequirementMatches(candidates, asset, roles, a.requirement, a.role, windowStart).length;
    const bMatches = buildRequirementMatches(candidates, asset, roles, b.requirement, b.role, windowStart).length;
    if (aMatches !== bMatches) {
      return aMatches - bMatches;
    }

    return a.requirement.label.localeCompare(b.requirement.label);
  });

  for (const spec of allocationSpecs) {
    const matches = buildRequirementMatches(candidates, asset, roles, spec.requirement, spec.role, windowStart);
    const availableCount = matches.length;
    const gap = { ...spec.requirement, availableCount } satisfies RequirementGap;

    if (gap.severity === "preferred") {
      if (availableCount < gap.requiredCount) {
        preferredGaps.push(gap);
      }
    } else if (availableCount < gap.requiredCount) {
      if (gap.severity === "hard_stop") {
        missingHardStopRoles.push(gap);
      } else {
        missingRequiredRoles.push(gap);
      }
    }

    let remaining = gap.requiredCount;
    for (const match of matches) {
      if (remaining <= 0) {
        break;
      }

      if (usedProfileIds.has(match.candidate.profile.id)) {
        roleConflicts.add(
          `${match.candidate.profile.display_name ?? match.candidate.profile.email ?? match.candidate.profile.id} is already allocated as ${selectedByProfileId.get(match.candidate.profile.id) ?? "another role"} and was skipped for ${match.requirementLabel}.`,
        );
        continue;
      }

      const allocated = buildAllocationCrew(match, assetType);
      usedProfileIds.add(match.candidate.profile.id);
      selectedByProfileId.set(match.candidate.profile.id, match.roleLabel);
      remaining -= 1;

      if (spec.bucket === "launch_recovery") {
        likelyLaunchRecoveryCrew.push(allocated);
      } else if (spec.bucket === "shore") {
        likelyShoreSupportCrew.push(allocated);
      } else {
        likelyBoatCrew.push(allocated);
      }
    }

    if (remaining > 0 && gap.severity !== "preferred") {
      for (const match of matches) {
        restoreReadyCrew.set(match.candidate.profile.id, match.candidate.profile);
      }
    }
  }

  if (headLauncherRole) {
    const headLauncherMatch = candidates
      .map((candidate) => {
        const qualification = candidate.qualifications.find((item) => {
          return isQualificationCurrentGreenForAsset(item, asset, windowStart) && item.operational_role_id === headLauncherRole.id;
        });

        if (!qualification) {
          return null;
        }

        return {
          candidate,
          qualification,
          role: headLauncherRole,
          source: getQualificationSource(qualification, asset),
          score: 0,
          requirementLabel: "Head Launcher",
          roleLabel: headLauncherRole.name,
          bucket: "launch_recovery" as const,
        } satisfies AllocationMatch;
      })
      .find((match) => Boolean(match)) as AllocationMatch | null;

    if (headLauncherMatch) {
      headLauncherCrew = [buildAllocationCrew(headLauncherMatch, assetType)];

      if (usedProfileIds.has(headLauncherMatch.candidate.profile.id)) {
        headLauncherStatus = "conflict_boat_crew";
        headLauncherLabel = "Head Launcher conflict";
        roleConflicts.add(
          `Head Launcher conflict: ${headLauncherMatch.candidate.profile.display_name ?? headLauncherMatch.candidate.profile.email ?? headLauncherMatch.candidate.profile.id} is also counted as boat crew.`,
        );
      } else if (currentDlaProfileId && headLauncherMatch.candidate.profile.id === currentDlaProfileId) {
        headLauncherStatus = "conflict_launch_authority";
        headLauncherLabel = "Head Launcher conflict";
        roleConflicts.add(
          `Head Launcher conflict: ${headLauncherMatch.candidate.profile.display_name ?? headLauncherMatch.candidate.profile.email ?? headLauncherMatch.candidate.profile.id} is acting as Launch Authority / DLA.`,
        );
      } else {
        headLauncherStatus = "available";
        headLauncherLabel = "Head Launcher available";
      }
    }
  }

  return {
    likelyBoatCrew,
    likelyLaunchRecoveryCrew,
    likelyShoreSupportCrew,
    missingHardStopRoles,
    missingRequiredRoles,
    preferredGaps,
    roleConflicts: [...roleConflicts],
    crewWhoCouldRestoreReadiness: [...restoreReadyCrew.values()],
    headLauncher: {
      status: headLauncherStatus,
      label: headLauncherLabel,
      crew: headLauncherCrew,
      notes: headLauncherNotes,
    },
  } satisfies AdvisoryAllocationSummary;
}

function createEmptyAllocationSummary(additionalNotes: string[] = []): AdvisoryAllocationSummary {
  return {
    likelyBoatCrew: [],
    likelyLaunchRecoveryCrew: [],
    likelyShoreSupportCrew: [],
    missingHardStopRoles: [],
    missingRequiredRoles: [],
    preferredGaps: [],
    roleConflicts: [],
    crewWhoCouldRestoreReadiness: [],
    headLauncher: {
      status: "missing",
      label: "Missing Head Launcher",
      crew: [],
      notes: ["Head Launcher role is not yet configured in operational roles.", ...additionalNotes],
    },
  };
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
  currentDlaProfileId: string | null;
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
    currentDlaProfileId,
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
      missingHardStopRoles: [] as RequirementGap[],
      missingRequiredRoles: [] as RequirementGap[],
      launchRecoveryGaps: [] as RequirementGap[],
      preferredGaps: [] as RequirementGap[],
      likelyBoatCrew: [],
      likelyLaunchRecoveryCrew: [],
      likelyShoreSupportCrew: [],
      roleConflicts: [],
      crewWhoCouldRestoreReadiness: [],
      headLauncher: createEmptyAllocationSummary(["Asset is marked inactive or off service."]).headLauncher,
      allocation: createEmptyAllocationSummary(["Asset is marked inactive or off service."]),
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
      missingHardStopRoles: [] as RequirementGap[],
      missingRequiredRoles: [] as RequirementGap[],
      launchRecoveryGaps: [] as RequirementGap[],
      preferredGaps: [] as RequirementGap[],
      likelyBoatCrew: [],
      likelyLaunchRecoveryCrew: [],
      likelyShoreSupportCrew: [],
      roleConflicts: [],
      crewWhoCouldRestoreReadiness: [],
      headLauncher: createEmptyAllocationSummary([`No safe-crewing rule exists for ${assetType?.name ?? asset.name} (${operationType}).`]).headLauncher,
      allocation: createEmptyAllocationSummary([`No safe-crewing rule exists for ${assetType?.name ?? asset.name} (${operationType}).`]),
      notes: [`No safe-crewing rule exists for ${assetType?.name ?? asset.name} (${operationType}).`],
      currentCrew: [] as CrewCandidate[],
      capabilityBadges: [] as ReturnType<typeof buildCapabilityBadges>,
    };
  }

  const currentCrew = getAssetCandidatesForCrew(candidates, asset, windowStart, windowEnd);
  const matchingRoleRequirements = roleRequirements.filter((requirement) => requirement.asset_type_id === asset.asset_type_id);
  const matchingLaunchRecovery = launchRecoveryRequirements.filter((requirement) => requirement.asset_id === asset.id);
  const allocation = buildAllocationSummary({
    candidates: currentCrew,
    asset,
    assetType,
    roleRequirements: matchingRoleRequirements,
    launchRecoveryRequirements: matchingLaunchRecovery,
    roles,
    windowStart,
    currentDlaProfileId,
  });
  const missingHardStopRoles = allocation.missingHardStopRoles;
  const missingRequiredRoles = allocation.missingRequiredRoles;
  const preferredGaps = allocation.preferredGaps;
  const launchRecoveryGaps = matchingLaunchRecovery
    .filter((requirement) => requirement.requirement_level !== "preferred")
    .flatMap((requirement) => {
      const role = getRoleById(roles, requirement.operational_role_id);
      const requirementGap = {
        id: requirement.id,
        label: getRequirementLabel(assetType?.name ?? null, role?.name ?? null),
        severity: requirement.requirement_level,
        requiredCount: requirement.required_count,
        availableCount: 0,
        operationalRoleId: requirement.operational_role_id,
        assetTypeId: assetType?.id ?? null,
        bucket: "launch_recovery" as const,
      } satisfies RequirementGap;
      const availableCount = buildRequirementMatches(currentCrew, asset, roles, requirementGap, role, windowStart).length;
      if (availableCount >= requirement.required_count) {
        return [];
      }

      return [toRequirementGap(requirement, availableCount, role, assetType, "launch_recovery")];
    });

  const missingRoles: RequirementGap[] = [...missingHardStopRoles, ...missingRequiredRoles];
  const roleConflicts = allocation.roleConflicts;
  const capabilityBadges = buildCapabilityBadges(
    currentCrew.flatMap((member) =>
      member.qualifications.filter((qualification) => isQualificationCurrent(qualification, windowStart) && qualification.currency_state === "green" && isQualificationRelevantToAsset(qualification, asset)),
    ),
  );

  const availableCrewCount = currentCrew.length;
  const hasHardStopGaps = missingHardStopRoles.length > 0 || launchRecoveryGaps.some((gap) => gap.severity === "hard_stop");
  const hasRequiredGaps = missingRequiredRoles.length > 0 || launchRecoveryGaps.some((gap) => gap.severity === "required");
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
    missingHardStopRoles,
    missingRequiredRoles,
    launchRecoveryGaps,
    preferredGaps,
    likelyBoatCrew: allocation.likelyBoatCrew,
    likelyLaunchRecoveryCrew: allocation.likelyLaunchRecoveryCrew,
    likelyShoreSupportCrew: allocation.likelyShoreSupportCrew,
    roleConflicts,
    crewWhoCouldRestoreReadiness: allocation.crewWhoCouldRestoreReadiness,
    headLauncher: allocation.headLauncher,
    allocation,
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
    const currentDlaProfileId = getFirstRecord(currentDlaDuty?.profile)?.id ?? null;

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
        currentDlaProfileId,
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
