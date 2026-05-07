"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  buildRedirectUrl,
  getAdminAccessContext,
  getFormString,
  parseBoolean,
  requireStationAccess,
  requireSuperAdmin,
  slugify,
  upperSnakeCase,
} from "@/lib/admin-crud";

function redirectWithFeedback(pathname: string, feedback: string, stationId?: string | null) {
  redirect(
    buildRedirectUrl(pathname, {
      success: feedback,
      stationId: stationId ?? undefined,
    }),
  );
}

function getReturnPath(formData: FormData, fallback: string) {
  const value = getFormString(formData, "return_path");
  return value || fallback;
}

export async function saveStationAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/stations");
  const stationId = getFormString(formData, "station_id");
  const organisationId = getFormString(formData, "organisation_id");
  const name = getFormString(formData, "name");
  const code = getFormString(formData, "code");
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/stations");
  const slug = slugify(name);

  if (!name) {
    redirectWithFeedback(returnPath, "Station name is required.");
  }

  if (stationId) {
    requireStationAccess(context, stationId);

    const { error } = await supabase
      .from("stations")
      .update({
        name,
        code: code || upperSnakeCase(name),
        slug,
        is_active: isActive,
      })
      .eq("id", stationId);

    if (error) {
      redirectWithFeedback(returnPath, error.message);
    }

    revalidatePath("/admin/stations");
    redirectWithFeedback(returnPath, "Station updated.", stationId);
  }

  requireSuperAdmin(context);

  if (!organisationId) {
    redirectWithFeedback(returnPath, "Organisation is required.");
  }

  const { error } = await supabase.from("stations").insert({
    organisation_id: organisationId,
    name,
    code: code || upperSnakeCase(name),
    slug,
    is_active: isActive,
  });

  if (error) {
    redirectWithFeedback(returnPath, error.message);
  }

  revalidatePath("/admin/stations");
  redirectWithFeedback(returnPath, "Station created.");
}

export async function saveLocationAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/locations");
  const locationId = getFormString(formData, "location_id");
  const stationId = getFormString(formData, "station_id");
  const name = getFormString(formData, "name");
  const notes = getFormString(formData, "notes") || null;
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/locations");
  const sortOrderRaw = getFormString(formData, "sort_order");
  const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Number(sortOrderRaw) : 0;
  const slug = slugify(name);

  if (!stationId) {
    redirectWithFeedback(returnPath, "Station is required.");
  }

  requireStationAccess(context, stationId);

  if (!name) {
    redirectWithFeedback(returnPath, "Location name is required.");
  }

  if (locationId) {
    const { error } = await supabase
      .from("station_locations")
      .update({
        station_id: stationId,
        name,
        slug,
        sort_order: sortOrder,
        notes,
        is_active: isActive,
      })
      .eq("id", locationId);

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }

    revalidatePath("/admin/locations");
    redirectWithFeedback(returnPath, "Location updated.", stationId);
  }

  const { error } = await supabase.from("station_locations").insert({
    station_id: stationId,
    name,
    slug,
    sort_order: sortOrder,
    notes,
    is_active: isActive,
  });

  if (error) {
    redirectWithFeedback(returnPath, error.message, stationId);
  }

  revalidatePath("/admin/locations");
  redirectWithFeedback(returnPath, "Location created.", stationId);
}

export async function saveAssetTypeAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/asset-types");
  requireSuperAdmin(context);

  const assetTypeId = getFormString(formData, "asset_type_id");
  const code = getFormString(formData, "code");
  const name = getFormString(formData, "name");
  const category = getFormString(formData, "category") as
    | "lifeboat"
    | "launch_recovery"
    | "vehicle"
    | "equipment"
    | "support";
  const description = getFormString(formData, "description") || null;
  const requiresRecoveryEquipment = parseBoolean(formData.get("requires_recovery_equipment"));
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/asset-types");

  if (!code || !name) {
    redirectWithFeedback(returnPath, "Code and name are required.");
  }

  if (assetTypeId) {
    const { error } = await supabase
      .from("asset_types")
      .update({
        code,
        name,
        category,
        description,
        requires_recovery_equipment: requiresRecoveryEquipment,
        is_active: isActive,
      })
      .eq("id", assetTypeId);

    if (error) {
      redirectWithFeedback(returnPath, error.message);
    }

    revalidatePath("/admin/asset-types");
    redirectWithFeedback(returnPath, "Asset type updated.");
  }

  const { error } = await supabase.from("asset_types").insert({
    code,
    name,
    category,
    description,
    requires_recovery_equipment: requiresRecoveryEquipment,
    is_active: isActive,
  });

  if (error) {
    redirectWithFeedback(returnPath, error.message);
  }

  revalidatePath("/admin/asset-types");
  redirectWithFeedback(returnPath, "Asset type created.");
}

export async function saveAssetAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/assets");
  const assetId = getFormString(formData, "asset_id");
  const stationId = getFormString(formData, "station_id");
  const stationLocationId = getFormString(formData, "station_location_id");
  const assetTypeId = getFormString(formData, "asset_type_id");
  const name = getFormString(formData, "name");
  const assetCode = getFormString(formData, "asset_code");
  const status = getFormString(formData, "status") as
    | "ready"
    | "amber"
    | "red"
    | "maintenance"
    | "off_service";
  const requiresRecoverySupport = parseBoolean(formData.get("requires_recovery_support"));
  const notes = getFormString(formData, "notes") || null;
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/assets");

  if (!stationId || !stationLocationId || !assetTypeId) {
    redirectWithFeedback(returnPath, "Station, location, and asset type are required.");
  }

  requireStationAccess(context, stationId);

  if (!name || !assetCode) {
    redirectWithFeedback(returnPath, "Asset name and asset code are required.", stationId);
  }

  if (assetId) {
    const { error } = await supabase
      .from("assets")
      .update({
        station_id: stationId,
        station_location_id: stationLocationId,
        asset_type_id: assetTypeId,
        name,
        asset_code: assetCode,
        status,
        requires_recovery_support: requiresRecoverySupport,
        notes,
        is_active: isActive,
      })
      .eq("id", assetId);

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }

    revalidatePath("/admin/assets");
    redirectWithFeedback(returnPath, "Asset updated.", stationId);
  }

  const { error } = await supabase.from("assets").insert({
    station_id: stationId,
    station_location_id: stationLocationId,
    asset_type_id: assetTypeId,
    name,
    asset_code: assetCode,
    status,
    requires_recovery_support: requiresRecoverySupport,
    notes,
    metadata: {},
    is_active: isActive,
  });

  if (error) {
    redirectWithFeedback(returnPath, error.message, stationId);
  }

  revalidatePath("/admin/assets");
  redirectWithFeedback(returnPath, "Asset created.", stationId);
}
