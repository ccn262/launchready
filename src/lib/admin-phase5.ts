import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAdminAccessContext,
  loadAssetTypes,
  loadStationAssets,
  loadStationLocations,
  resolveSelectedStationContext,
  type AssetRecord,
  type AssetTypeRecord,
  type SelectedStationContext,
  type StationLocationRecord,
  type StationOption,
  type AdminAccessContext,
} from "@/lib/admin-crud";

export type CrewTypeRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
};

export type CrewProfileRecord = {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  system_role: "standard" | "super_admin";
  is_active: boolean;
};

export type StationMembershipRecord = {
  id: string;
  profile_id: string;
  station_id: string;
  crew_type_id: string | null;
  membership_role: "crew" | "dla" | "lom" | "admin";
  is_primary: boolean;
  is_active: boolean;
  profile:
    | CrewProfileRecord
    | CrewProfileRecord[]
    | null;
  crew_type:
    | CrewTypeRecord
    | CrewTypeRecord[]
    | null;
  station:
    | { id: string; name: string; slug: string; organisation_id: string }
    | { id: string; name: string; slug: string; organisation_id: string }[]
    | null;
};

export type OperationalRoleRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
};

export type QualificationTypeRecord = {
  id: string;
  code: string;
  name: string;
  kind: "operational" | "casualty_care" | "support" | "safety";
  description: string | null;
  requires_expiry: boolean;
  is_active: boolean;
};

export type CrewQualificationRecord = {
  id: string;
  profile_id: string;
  station_id: string;
  qualification_type_id: string | null;
  asset_type_id: string | null;
  asset_id: string | null;
  operational_role_id: string | null;
  currency_state: "green" | "amber" | "red";
  starts_on: string;
  expires_on: string | null;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  is_active: boolean;
  profile:
    | CrewProfileRecord
    | CrewProfileRecord[]
    | null;
  qualification_type:
    | QualificationTypeRecord
    | QualificationTypeRecord[]
    | null;
  operational_role:
    | OperationalRoleRecord
    | OperationalRoleRecord[]
    | null;
  asset:
    | AssetRecord
    | AssetRecord[]
    | null;
};

function getFirstRecord<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export async function getPhase5AdminContext(pathname = "/admin") {
  return getAdminAccessContext(pathname);
}

export async function loadCrewTypes() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("crew_types")
    .select("id, code, name, description, is_active")
    .order("name", { ascending: true });

  return (data ?? []) as CrewTypeRecord[];
}

export async function loadOperationalRoles() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("operational_roles")
    .select("id, code, name, description, category, is_active")
    .order("name", { ascending: true });

  return (data ?? []) as OperationalRoleRecord[];
}

export async function loadQualificationTypes() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("qualification_types")
    .select("id, code, name, kind, description, requires_expiry, is_active")
    .order("name", { ascending: true });

  return (data ?? []) as QualificationTypeRecord[];
}

export async function loadStationMemberships(stationId: string) {
  const supabase = await createSupabaseServerClient();
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
        ),
        crew_type:crew_types (
          id,
          code,
          name,
          description,
          is_active
        ),
        station:stations (
          id,
          name,
          slug,
          organisation_id
        )
      `,
    )
    .eq("station_id", stationId)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  return ((data ?? []) as StationMembershipRecord[]).map((membership) => ({
    ...membership,
    profile: getFirstRecord(membership.profile),
    crew_type: getFirstRecord(membership.crew_type),
    station: getFirstRecord(membership.station),
  }));
}

export async function loadStationProfiles(stationId: string) {
  const memberships = await loadStationMemberships(stationId);
  return memberships
    .map((membership) => membership.profile)
    .filter((profile): profile is CrewProfileRecord => Boolean(profile));
}

export async function loadCrewQualifications(stationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
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
    .eq("station_id", stationId)
    .order("is_active", { ascending: false })
    .order("starts_on", { ascending: false });

  return ((data ?? []) as CrewQualificationRecord[]).map((record) => ({
    ...record,
    profile: getFirstRecord(record.profile),
    qualification_type: getFirstRecord(record.qualification_type),
    operational_role: getFirstRecord(record.operational_role),
    asset: getFirstRecord(record.asset),
  }));
}

export async function loadCrewPageData(pathname: string, requestedStationId: string | null) {
  const { context } = await getPhase5AdminContext(pathname);
  const stationContext = await resolveSelectedStationContext(context, requestedStationId);
  const stations = stationContext.stationOptions;
  const selectedStationId = stationContext.selectedStationId;
  const selectedStation = stationContext.selectedStation;

  return {
    context,
    stationContext,
    stations,
    selectedStationId,
    selectedStation,
    crewTypes: await loadCrewTypes(),
    operationalRoles: await loadOperationalRoles(),
    qualificationTypes: await loadQualificationTypes(),
    memberships: selectedStationId ? await loadStationMemberships(selectedStationId) : [],
    crewQualifications: selectedStationId ? await loadCrewQualifications(selectedStationId) : [],
    assets: selectedStationId ? await loadStationAssets(selectedStationId) : [],
    locations: selectedStationId ? await loadStationLocations(selectedStationId) : [],
    assetTypes: await loadAssetTypes(),
  } satisfies {
    context: AdminAccessContext;
    stationContext: SelectedStationContext;
    stations: StationOption[];
    selectedStationId: string | null;
    selectedStation: StationOption | null;
    crewTypes: CrewTypeRecord[];
    operationalRoles: OperationalRoleRecord[];
    qualificationTypes: QualificationTypeRecord[];
    memberships: StationMembershipRecord[];
    crewQualifications: CrewQualificationRecord[];
    assets: AssetRecord[];
    locations: StationLocationRecord[];
    assetTypes: AssetTypeRecord[];
  };
}
