import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type StationMembership = {
  id: string;
  station_id: string;
  membership_role: "crew" | "dla" | "lom" | "admin";
  is_primary: boolean;
  is_active: boolean;
  station:
    | {
        id: string;
        name: string;
        slug: string;
        organisation_id: string;
      }
    | {
        id: string;
        name: string;
        slug: string;
        organisation_id: string;
      }[]
    | null;
};

export type ProfileRecord = {
  id: string;
  organisation_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  system_role: "standard" | "super_admin";
  is_active: boolean;
};

export type CurrentUserContext = {
  user: User | null;
  profile: ProfileRecord | null;
  memberships: StationMembership[];
  isAuthenticated: boolean;
  isProfileActive: boolean;
  isSuperAdmin: boolean;
  canAccessCrew: boolean;
  canAccessDla: boolean;
  canAccessAdmin: boolean;
  stationCount: number;
  primaryStationName: string | null;
  primaryStationRole: string | null;
};

function normalizeMembershipRole(
  role: StationMembership["membership_role"],
): string {
  switch (role) {
    case "admin":
      return "Station admin";
    case "lom":
      return "LOM";
    case "dla":
      return "DLA";
    case "crew":
      return "Crew";
  }
}

function getStationRecord(station: StationMembership["station"]) {
  if (Array.isArray(station)) {
    return station[0] ?? null;
  }

  return station;
}

export async function getCurrentUserContext(): Promise<CurrentUserContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
      memberships: [],
      isAuthenticated: false,
      isProfileActive: false,
      isSuperAdmin: false,
      canAccessCrew: false,
      canAccessDla: false,
      canAccessAdmin: false,
      stationCount: 0,
      primaryStationName: null,
      primaryStationRole: null,
    };
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, organisation_id, display_name, email, phone, system_role, is_active")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("station_memberships")
      .select(
        `
          id,
          station_id,
          membership_role,
          is_primary,
          is_active,
          station:stations (
            id,
            name,
            slug,
            organisation_id
          )
        `,
      )
      .eq("profile_id", user.id)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  const activeMemberships = ((memberships ?? []) as unknown as StationMembership[]).filter(
    (membership) => membership.is_active,
  );
  const roleSet = new Set(activeMemberships.map((membership) => membership.membership_role));
  const profileRecord = (profile ?? null) as ProfileRecord | null;
  const isProfileActive = profileRecord?.is_active === true;
  const isSuperAdmin = isProfileActive && profileRecord?.system_role === "super_admin";
  const canAccessCrew = isProfileActive && (isSuperAdmin || activeMemberships.length > 0);
  const canAccessDla =
    isProfileActive &&
    (isSuperAdmin ||
    roleSet.has("dla") ||
    roleSet.has("lom") ||
    roleSet.has("admin"));
  const canAccessAdmin =
    isProfileActive && (isSuperAdmin || roleSet.has("lom") || roleSet.has("admin"));
  const primaryMembership =
    activeMemberships.find((membership) => membership.is_primary) ??
    activeMemberships[0] ??
    null;
  const primaryStation = primaryMembership
    ? getStationRecord(primaryMembership.station)
    : null;

  return {
    user,
    profile: profileRecord,
    memberships: activeMemberships,
    isAuthenticated: isProfileActive,
    isProfileActive,
    isSuperAdmin,
    canAccessCrew,
    canAccessDla,
    canAccessAdmin,
    stationCount: activeMemberships.length,
    primaryStationName: primaryStation?.name ?? null,
    primaryStationRole: primaryMembership
      ? normalizeMembershipRole(primaryMembership.membership_role)
      : null,
  };
}

export function getRoleSummary(context: CurrentUserContext) {
  if (!context.isAuthenticated || !context.profile) {
    return {
      headline: "Not signed in",
      detail: "Login required",
    };
  }

  if (context.isSuperAdmin) {
    return {
      headline: "Super admin",
      detail: context.profile.display_name ?? context.profile.email ?? "Launch Ready",
    };
  }

  if (context.primaryStationRole && context.primaryStationName) {
    return {
      headline: context.primaryStationRole,
      detail: context.primaryStationName,
    };
  }

  return {
    headline: "Station member",
    detail: context.profile.display_name ?? context.profile.email ?? "Launch Ready",
  };
}

export function canAccessPath(
  pathname: string,
  context: Pick<
    CurrentUserContext,
    | "isAuthenticated"
    | "isProfileActive"
    | "canAccessCrew"
    | "canAccessDla"
    | "canAccessAdmin"
    | "isSuperAdmin"
  >,
) {
  if (pathname === "/") {
    return context.isAuthenticated && context.isProfileActive;
  }

  if (pathname.startsWith("/crew")) {
    return context.isAuthenticated && context.isProfileActive && context.canAccessCrew;
  }

  if (pathname.startsWith("/dla")) {
    return context.isAuthenticated && context.isProfileActive && context.canAccessDla;
  }

  if (pathname.startsWith("/admin")) {
    return context.isAuthenticated && context.isProfileActive && context.canAccessAdmin;
  }

  return true;
}

export function getUnauthorizedReason(pathname: string) {
  if (pathname.startsWith("/admin")) {
    return "Admin access requires station admin, LOM, or super admin permissions.";
  }

  if (pathname.startsWith("/dla")) {
    return "DLA access requires DLA, LOM, station admin, or super admin permissions.";
  }

  if (pathname.startsWith("/crew")) {
    return "Crew access requires authenticated station membership.";
  }

  return "You are not authorised to view this page.";
}
