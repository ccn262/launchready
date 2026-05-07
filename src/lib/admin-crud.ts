import "server-only";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireRouteAccess } from "@/lib/auth";
import type { CurrentUserContext } from "@/lib/auth";

export type OrganisationRecord = {
  id: string;
  name: string;
  slug: string;
  is_demo: boolean;
};

export type StationRecord = {
  id: string;
  organisation_id: string;
  name: string;
  code: string | null;
  slug: string;
  is_active: boolean;
  organisation:
    | { id: string; name: string; slug: string }
    | { id: string; name: string; slug: string }[]
    | null;
};

export type StationLocationRecord = {
  id: string;
  station_id: string;
  name: string;
  slug: string;
  sort_order: number;
  notes: string | null;
  is_active: boolean;
  station:
    | { id: string; name: string; slug: string; organisation_id: string }
    | { id: string; name: string; slug: string; organisation_id: string }[]
    | null;
};

export type AssetTypeRecord = {
  id: string;
  code: string;
  name: string;
  category: "lifeboat" | "launch_recovery" | "vehicle" | "equipment" | "support";
  description: string | null;
  requires_recovery_equipment: boolean;
  is_active: boolean;
};

export type AssetRecord = {
  id: string;
  station_id: string;
  station_location_id: string;
  asset_type_id: string;
  name: string;
  asset_code: string | null;
  status: "ready" | "amber" | "red" | "maintenance" | "off_service";
  requires_recovery_support: boolean;
  notes: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  station:
    | { id: string; name: string; slug: string; organisation_id: string }
    | { id: string; name: string; slug: string; organisation_id: string }[]
    | null;
  station_location:
    | { id: string; name: string; slug: string; sort_order: number; station_id: string; notes: string | null }
    | { id: string; name: string; slug: string; sort_order: number; station_id: string; notes: string | null }[]
    | null;
  asset_type:
    | {
        id: string;
        code: string;
        name: string;
        category: string;
        description: string | null;
        requires_recovery_equipment: boolean;
        is_active: boolean;
      }
    | {
        id: string;
        code: string;
        name: string;
        category: string;
        description: string | null;
        requires_recovery_equipment: boolean;
        is_active: boolean;
      }[]
    | null;
};

export type StationOption = {
  id: string;
  organisation_id: string;
  organisation_name: string;
  name: string;
  code: string | null;
  slug: string;
  is_active: boolean;
};

export type SelectedStationContext = {
  requestedStationId: string | null;
  selectedStationId: string | null;
  selectedStation: StationOption | null;
  stationOptions: StationOption[];
};

export type AdminAccessContext = CurrentUserContext;

function getFirstRecord<T>(value: T | T[] | null) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function upperSnakeCase(value: string) {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

export function parseBoolean(value: FormDataEntryValue | null) {
  return value === "true" || value === "on" || value === "1";
}

export function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function buildRedirectUrl(pathname: string, params: Record<string, string | null | undefined>) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export async function getAdminAccessContext(pathname = "/admin") {
  const context = await requireRouteAccess(pathname);
  const supabase = await createSupabaseServerClient();

  return { context, supabase };
}

export function getManagedStationIds(context: AdminAccessContext) {
  if (context.isSuperAdmin) {
    return [];
  }

  return Array.from(
    new Set(
      context.memberships
        .filter((membership) => membership.is_active)
        .filter((membership) => membership.membership_role === "admin" || membership.membership_role === "lom")
        .map((membership) => membership.station_id),
    ),
  );
}

export function canManageStationId(context: AdminAccessContext, stationId: string) {
  return context.isSuperAdmin || getManagedStationIds(context).includes(stationId);
}

export function requireStationAccess(context: AdminAccessContext, stationId: string) {
  if (!canManageStationId(context, stationId)) {
    redirect(
      buildRedirectUrl("/unauthorized", {
        reason: "This station is outside your management scope.",
      }),
    );
  }
}

export function requireSuperAdmin(context: AdminAccessContext) {
  if (!context.isSuperAdmin) {
    redirect(
      buildRedirectUrl("/unauthorized", {
        reason: "Only super admins can manage this reference data.",
      }),
    );
  }
}

export async function loadStationOptions(context: AdminAccessContext) {
  const supabase = await createSupabaseServerClient();

  if (context.isSuperAdmin) {
    const { data } = await supabase
      .from("stations")
      .select(
        `
          id,
          organisation_id,
          name,
          code,
          slug,
          is_active,
          organisation:organisations (
            id,
            name,
            slug
          )
        `,
      )
      .order("name", { ascending: true });

    return ((data ?? []) as StationRecord[]).map((station) => {
      const organisation = getFirstRecord(station.organisation);
      return {
        id: station.id,
        organisation_id: station.organisation_id,
        organisation_name: organisation?.name ?? "Unknown organisation",
        name: station.name,
        code: station.code,
        slug: station.slug,
        is_active: station.is_active,
      } satisfies StationOption;
    });
  }

  const ids = getManagedStationIds(context);
  if (!ids.length) {
    return [];
  }

  const { data } = await supabase
    .from("stations")
    .select(
      `
        id,
        organisation_id,
        name,
        code,
        slug,
        is_active,
        organisation:organisations (
          id,
          name,
          slug
        )
      `,
    )
    .in("id", ids)
    .order("name", { ascending: true });

  return ((data ?? []) as StationRecord[]).map((station) => {
    const organisation = getFirstRecord(station.organisation);
    return {
      id: station.id,
      organisation_id: station.organisation_id,
      organisation_name: organisation?.name ?? "Unknown organisation",
      name: station.name,
      code: station.code,
      slug: station.slug,
      is_active: station.is_active,
    } satisfies StationOption;
  });
}

export async function resolveSelectedStationContext(
  context: AdminAccessContext,
  requestedStationId: string | null,
) {
  const stationOptions = await loadStationOptions(context);
  const selectedStationId =
    (requestedStationId && stationOptions.some((station) => station.id === requestedStationId)
      ? requestedStationId
      : null) ?? stationOptions[0]?.id ?? null;

  return {
    requestedStationId,
    selectedStationId,
    selectedStation: stationOptions.find((station) => station.id === selectedStationId) ?? null,
    stationOptions,
  } satisfies SelectedStationContext;
}

export async function loadStationLocations(stationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("station_locations")
    .select(
      `
        id,
        station_id,
        name,
        slug,
        sort_order,
        notes,
        is_active,
        station:stations (
          id,
          name,
          slug,
          organisation_id
        )
      `,
    )
    .eq("station_id", stationId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  return ((data ?? []) as StationLocationRecord[]).map((location) => ({
    ...location,
    station: getFirstRecord(location.station),
  }));
}

export async function loadAssetTypes() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("asset_types")
    .select(
      "id, code, name, category, description, requires_recovery_equipment, is_active",
    )
    .order("name", { ascending: true });

  return (data ?? []) as AssetTypeRecord[];
}

export async function loadStationAssets(stationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
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
        is_active,
        station:stations (
          id,
          name,
          slug,
          organisation_id
        ),
        station_location:station_locations (
          id,
          name,
          slug,
          sort_order,
          station_id,
          notes
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
      `,
    )
    .eq("station_id", stationId)
    .order("name", { ascending: true });

  return ((data ?? []) as AssetRecord[]).map((asset) => ({
    ...asset,
    station: getFirstRecord(asset.station),
    station_location: getFirstRecord(asset.station_location),
    asset_type: getFirstRecord(asset.asset_type),
  }));
}
