import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRouteAccess, type CurrentUserContext } from "@/lib/auth";
import {
  getAdminAccessContext,
  loadAssetTypes,
  loadStationAssets,
  loadStationLocations,
  resolveSelectedStationContext,
  type AssetRecord,
  type AssetTypeRecord,
  type StationLocationRecord,
  type StationOption,
} from "@/lib/admin-crud";
import {
  loadCrewQualifications,
  loadOperationalRoles,
  loadStationMemberships,
  type CrewQualificationRecord,
  type OperationalRoleRecord,
  type StationMembershipRecord,
} from "@/lib/admin-phase5";

export type AvailabilitySlotRecord = {
  id: string;
  profile_id: string;
  station_id: string;
  station_location_id: string | null;
  asset_type_id: string | null;
  asset_id: string | null;
  operational_role_id: string | null;
  slot_kind: "full_day" | "partial_day" | "night_cover" | "unavailable" | "weekend_unavailable";
  coverage_date: string | null;
  start_time: string;
  end_time: string;
  starts_at: string | null;
  ends_at: string | null;
  days_of_week: number[];
  is_recurring: boolean;
  is_active: boolean;
  notes: string | null;
  created_by_profile_id: string | null;
  profile:
    | {
        id: string;
        display_name: string | null;
        email: string | null;
        phone: string | null;
        system_role: "standard" | "super_admin";
        is_active: boolean;
      }
    | {
        id: string;
        display_name: string | null;
        email: string | null;
        phone: string | null;
        system_role: "standard" | "super_admin";
        is_active: boolean;
      }[]
    | null;
  station_location:
    | { id: string; name: string; slug: string; sort_order: number; notes: string | null; station_id: string }
    | { id: string; name: string; slug: string; sort_order: number; notes: string | null; station_id: string }[]
    | null;
  asset_type:
    | { id: string; code: string; name: string; category: string; description: string | null; requires_recovery_equipment: boolean; is_active: boolean }
    | { id: string; code: string; name: string; category: string; description: string | null; requires_recovery_equipment: boolean; is_active: boolean }[]
    | null;
  asset:
    | AssetRecord
    | AssetRecord[]
    | null;
  operational_role:
    | OperationalRoleRecord
    | OperationalRoleRecord[]
    | null;
};

export type DutyPeriodRecord = {
  id: string;
  station_id: string;
  profile_id: string | null;
  station_location_id: string | null;
  asset_type_id: string | null;
  asset_id: string | null;
  operational_role_id: string | null;
  period_kind: "day_cover" | "night_cover" | "launch_alert" | "incident_cover" | "training" | "weekend_cover" | "dla_day" | "dla_night";
  duty_date: string;
  start_time: string;
  end_time: string;
  starts_at: string | null;
  ends_at: string | null;
  source: string;
  notes: string | null;
  is_active: boolean;
  created_by_profile_id: string | null;
  profile:
    | {
        id: string;
        display_name: string | null;
        email: string | null;
        phone: string | null;
        system_role: "standard" | "super_admin";
        is_active: boolean;
      }
    | {
        id: string;
        display_name: string | null;
        email: string | null;
        phone: string | null;
        system_role: "standard" | "super_admin";
        is_active: boolean;
      }[]
    | null;
  station_location:
    | StationLocationRecord
    | StationLocationRecord[]
    | null;
  asset_type:
    | AssetTypeRecord
    | AssetTypeRecord[]
    | null;
  asset:
    | AssetRecord
    | AssetRecord[]
    | null;
  operational_role:
    | OperationalRoleRecord
    | OperationalRoleRecord[]
    | null;
};

function getFirstRecord<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function startOfNextFriday() {
  const now = new Date();
  const day = now.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  friday.setHours(19, 0, 0, 0);
  return friday;
}

function endOfWeekendDuty() {
  const friday = startOfNextFriday();
  const monday = new Date(friday);
  monday.setDate(friday.getDate() + 3);
  monday.setHours(7, 0, 0, 0);
  return { friday, monday };
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toTimeInputValue(date: Date) {
  return date.toISOString().slice(11, 16);
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function getNextWeekendWindow() {
  const { friday, monday } = endOfWeekendDuty();
  return {
    start: friday,
    end: monday,
    startDate: toDateInputValue(friday),
    startTime: toTimeInputValue(friday),
    endDate: toDateInputValue(monday),
    endTime: toTimeInputValue(monday),
    startDateTimeLocal: toDateTimeLocalValue(friday),
    endDateTimeLocal: toDateTimeLocalValue(monday),
  };
}

export function buildStationOptionsFromContext(context: CurrentUserContext): StationOption[] {
  const stationOptions: StationOption[] = [];

  for (const membership of context.memberships) {
    const station = getFirstRecord(membership.station);
    if (!station) {
      continue;
    }

    stationOptions.push({
      id: station.id,
      organisation_id: station.organisation_id,
      organisation_name: "Station scope",
      name: station.name,
      code: null,
      slug: station.slug,
      is_active: membership.is_active,
    });
  }

  return stationOptions;
}

export async function loadCrewAvailabilityContext(pathname: string, requestedStationId: string | null) {
  const context = await requireRouteAccess(pathname);
  const stationOptions = buildStationOptionsFromContext(context);
  const selectedStationId =
    (requestedStationId && stationOptions.some((station) => station.id === requestedStationId)
      ? requestedStationId
      : null) ?? stationOptions[0]?.id ?? null;
  const selectedStation = stationOptions.find((station) => station.id === selectedStationId) ?? null;
  const supabase = await createSupabaseServerClient();
  const profileId = context.user?.id ?? null;

  const [{ data: availabilityRows }, { data: dutyRows }, { data: qualificationsRows }, locationsRows, assetsRows, assetTypesRows, rolesRows] = await Promise.all([
    profileId && selectedStationId
      ? supabase
          .from("availability_slots")
          .select(
            `
              id,
              profile_id,
              station_id,
              station_location_id,
              asset_type_id,
              asset_id,
              operational_role_id,
              slot_kind,
              coverage_date,
              start_time,
              end_time,
              starts_at,
              ends_at,
              days_of_week,
              is_recurring,
              is_active,
              notes,
              created_by_profile_id,
              profile:profiles (
                id,
                display_name,
                email,
                phone,
                system_role,
                is_active
              ),
              station_location:station_locations (
                id,
                name,
                slug,
                sort_order,
                notes,
                station_id
              ),
              asset_type:asset_types (
                id,
                code,
                name,
                category,
                description,
                requires_recovery_equipment,
                is_active
              ),
              asset:assets (
                id,
                station_id,
                station_location_id,
                asset_type_id,
                name,
                asset_code,
                status,
                requires_recovery_support,
                metadata,
                is_active
              ),
              operational_role:operational_roles (
                id,
                code,
                name,
                description,
                category,
                is_active
              )
            `,
          )
          .eq("station_id", selectedStationId)
          .eq("profile_id", profileId)
          .order("starts_at", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    profileId && selectedStationId
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
              created_by_profile_id,
              profile:profiles (
                id,
                display_name,
                email,
                phone,
                system_role,
                is_active
              ),
              station_location:station_locations (
                id,
                name,
                slug,
                sort_order,
                notes,
                station_id
              ),
              asset_type:asset_types (
                id,
                code,
                name,
                category,
                description,
                requires_recovery_equipment,
                is_active
              ),
              asset:assets (
                id,
                station_id,
                station_location_id,
                asset_type_id,
                name,
                asset_code,
                status,
                requires_recovery_support,
                metadata,
                is_active
              ),
              operational_role:operational_roles (
                id,
                code,
                name,
                description,
                category,
                is_active
              )
            `,
          )
          .eq("station_id", selectedStationId)
          .eq("profile_id", profileId)
          .order("starts_at", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    profileId && selectedStationId
      ? supabase
          .from("crew_qualifications")
          .select(
            `
              id,
              profile_id,
              station_id,
              qualification_type_id,
              asset_type_id,
              asset_id,
              operational_role_id,
              currency_state,
              starts_on,
              expires_on,
              verified_at,
              verified_by,
              notes,
              is_active,
              profile:profiles (
                id,
                display_name,
                email,
                phone,
                system_role,
                is_active
              ),
              qualification_type:qualification_types (
                id,
                code,
                name,
                kind,
                description,
                requires_expiry,
                is_active
              ),
              operational_role:operational_roles (
                id,
                code,
                name,
                description,
                category,
                is_active
              ),
              asset:assets (
                id,
                station_id,
                station_location_id,
                asset_type_id,
                name,
                asset_code,
                status,
                requires_recovery_support,
                metadata,
                is_active,
                station_location:station_locations (
                  id,
                  name,
                  slug,
                  sort_order,
                  notes,
                  station_id
                ),
                asset_type:asset_types (
                  id,
                  code,
                  name,
                  category,
                  description,
                  requires_recovery_equipment,
                  is_active
                )
              )
            `,
          )
          .eq("profile_id", profileId)
          .eq("station_id", selectedStationId)
          .order("expires_on", { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] }),
    selectedStationId
      ? loadStationLocations(selectedStationId)
      : Promise.resolve([]),
    selectedStationId
      ? loadStationAssets(selectedStationId)
      : Promise.resolve([]),
    loadAssetTypes(),
    loadOperationalRoles(),
  ]);

  return {
    context,
    selectedStationId,
    selectedStation,
    stationOptions,
    profileId,
    availabilitySlots: ((availabilityRows ?? []) as AvailabilitySlotRecord[]).map((slot) => ({
      ...slot,
      profile: getFirstRecord(slot.profile),
      station_location: getFirstRecord(slot.station_location),
      asset_type: getFirstRecord(slot.asset_type),
      asset: getFirstRecord(slot.asset),
      operational_role: getFirstRecord(slot.operational_role),
    })),
    dutyPeriods: ((dutyRows ?? []) as DutyPeriodRecord[]).map((period) => ({
      ...period,
      profile: getFirstRecord(period.profile),
      station_location: getFirstRecord(period.station_location),
      asset_type: getFirstRecord(period.asset_type),
      asset: getFirstRecord(period.asset),
      operational_role: getFirstRecord(period.operational_role),
    })),
    crewQualifications: ((qualificationsRows ?? []) as CrewQualificationRecord[]).map((qualification) => ({
      ...qualification,
      profile: getFirstRecord(qualification.profile),
      qualification_type: getFirstRecord(qualification.qualification_type),
      operational_role: getFirstRecord(qualification.operational_role),
      asset: getFirstRecord(qualification.asset),
    })),
    locations: locationsRows as StationLocationRecord[],
    assets: assetsRows as AssetRecord[],
    assetTypes: assetTypesRows as AssetTypeRecord[],
    operationalRoles: rolesRows as OperationalRoleRecord[],
  };
}

export async function loadAdminAvailabilityContext(pathname: string, requestedStationId: string | null) {
  const { context } = await getAdminAccessContext(pathname);
  const stationContext = await resolveSelectedStationContext(context, requestedStationId);
  const selectedStationId = stationContext.selectedStationId;
  const selectedStation = stationContext.selectedStation;

  const supabase = await createSupabaseServerClient();

  const [{ data: availabilityRows }, { data: dutyRows }, membershipsRows, qualificationsRows, rolesRows, locationsRows, assetsRows, assetTypesRows] = await Promise.all([
    selectedStationId
      ? supabase
          .from("availability_slots")
          .select(
            `
              id,
              profile_id,
              station_id,
              station_location_id,
              asset_type_id,
              asset_id,
              operational_role_id,
              slot_kind,
              coverage_date,
              start_time,
              end_time,
              starts_at,
              ends_at,
              days_of_week,
              is_recurring,
              is_active,
              notes,
              created_by_profile_id,
              profile:profiles (
                id,
                display_name,
                email,
                phone,
                system_role,
                is_active
              ),
              station_location:station_locations (
                id,
                name,
                slug,
                sort_order,
                notes,
                station_id
              ),
              asset_type:asset_types (
                id,
                code,
                name,
                category,
                description,
                requires_recovery_equipment,
                is_active
              ),
              asset:assets (
                id,
                station_id,
                station_location_id,
                asset_type_id,
                name,
                asset_code,
                status,
                requires_recovery_support,
                metadata,
                is_active,
                station_location:station_locations (
                  id,
                  name,
                  slug,
                  sort_order,
                  notes,
                  station_id
                ),
                asset_type:asset_types (
                  id,
                  code,
                  name,
                  category,
                  description,
                  requires_recovery_equipment,
                  is_active
                )
              ),
              operational_role:operational_roles (
                id,
                code,
                name,
                description,
                category,
                is_active
              )
            `,
          )
          .eq("station_id", selectedStationId)
          .order("starts_at", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    selectedStationId
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
              created_by_profile_id,
              profile:profiles (
                id,
                display_name,
                email,
                phone,
                system_role,
                is_active
              ),
              station_location:station_locations (
                id,
                name,
                slug,
                sort_order,
                notes,
                station_id
              ),
              asset_type:asset_types (
                id,
                code,
                name,
                category,
                description,
                requires_recovery_equipment,
                is_active
              ),
              asset:assets (
                id,
                station_id,
                station_location_id,
                asset_type_id,
                name,
                asset_code,
                status,
                requires_recovery_support,
                metadata,
                is_active
              ),
              operational_role:operational_roles (
                id,
                code,
                name,
                description,
                category,
                is_active
              )
            `,
          )
          .eq("station_id", selectedStationId)
          .order("starts_at", { ascending: true })
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    selectedStationId ? loadStationMemberships(selectedStationId) : Promise.resolve([]),
    selectedStationId ? loadCrewQualifications(selectedStationId) : Promise.resolve([]),
    loadOperationalRoles(),
    selectedStationId ? loadStationLocations(selectedStationId) : Promise.resolve([]),
    selectedStationId ? loadStationAssets(selectedStationId) : Promise.resolve([]),
    loadAssetTypes(),
  ]);

  return {
    context,
    stationContext,
    selectedStationId,
    selectedStation,
    stationOptions: stationContext.stationOptions,
    availabilitySlots: ((availabilityRows ?? []) as AvailabilitySlotRecord[]).map((slot) => ({
      ...slot,
      profile: getFirstRecord(slot.profile),
      station_location: getFirstRecord(slot.station_location),
      asset_type: getFirstRecord(slot.asset_type),
      asset: getFirstRecord(slot.asset),
      operational_role: getFirstRecord(slot.operational_role),
    })),
    dutyPeriods: ((dutyRows ?? []) as DutyPeriodRecord[]).map((period) => ({
      ...period,
      profile: getFirstRecord(period.profile),
      station_location: getFirstRecord(period.station_location),
      asset_type: getFirstRecord(period.asset_type),
      asset: getFirstRecord(period.asset),
      operational_role: getFirstRecord(period.operational_role),
    })),
    memberships: membershipsRows as StationMembershipRecord[],
    crewQualifications: ((qualificationsRows ?? []) as CrewQualificationRecord[]).map((qualification) => ({
      ...qualification,
      profile: getFirstRecord(qualification.profile),
      qualification_type: getFirstRecord(qualification.qualification_type),
      operational_role: getFirstRecord(qualification.operational_role),
      asset: getFirstRecord(qualification.asset),
    })),
    operationalRoles: rolesRows as OperationalRoleRecord[],
    locations: locationsRows as StationLocationRecord[],
    assets: assetsRows as AssetRecord[],
    assetTypes: assetTypesRows as AssetTypeRecord[],
  };
}
