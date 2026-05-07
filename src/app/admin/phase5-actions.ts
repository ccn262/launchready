"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildRedirectUrl,
  getFormString,
  parseBoolean,
  requireStationAccess,
  requireSuperAdmin,
  getAdminAccessContext,
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

async function loadStationAssetTypeId(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, assetId: string) {
  const { data } = await supabase
    .from("assets")
    .select("id, asset_type_id")
    .eq("id", assetId)
    .maybeSingle();

  return data?.asset_type_id ?? null;
}

export async function saveMembershipAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/crew");
  const stationId = getFormString(formData, "station_id");
  const membershipId = getFormString(formData, "membership_id");
  const profileId = getFormString(formData, "profile_id");
  const profileEmail = getFormString(formData, "profile_email");
  const crewTypeId = getFormString(formData, "crew_type_id") || null;
  const membershipRole = getFormString(formData, "membership_role") as
    | "crew"
    | "dla"
    | "lom"
    | "admin";
  const isPrimary = parseBoolean(formData.get("is_primary"));
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/crew");

  if (!stationId) {
    redirectWithFeedback(returnPath, "Station is required.");
  }

  requireStationAccess(context, stationId);

  let resolvedProfileId = profileId;

  if (!resolvedProfileId && profileEmail) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, is_active")
      .eq("email", profileEmail)
      .maybeSingle();

    if (!profile) {
      redirectWithFeedback(returnPath, "No visible profile matched that email address.", stationId);
    }

    resolvedProfileId = profile?.id ?? "";
  }

  if (!resolvedProfileId) {
    redirectWithFeedback(returnPath, "Profile email is required.", stationId);
  }

  if (membershipId) {
    if (isPrimary) {
      await supabase
        .from("station_memberships")
        .update({ is_primary: false })
        .eq("station_id", stationId)
        .eq("profile_id", resolvedProfileId)
        .eq("is_primary", true)
        .neq("id", membershipId);
    }

    const { error } = await supabase
      .from("station_memberships")
      .update({
        crew_type_id: crewTypeId || null,
        membership_role: membershipRole,
        is_primary: isPrimary,
        is_active: isActive,
      })
      .eq("id", membershipId)
      .eq("station_id", stationId);

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  } else {
    if (isPrimary) {
      await supabase
        .from("station_memberships")
        .update({ is_primary: false })
        .eq("station_id", stationId)
        .eq("profile_id", resolvedProfileId)
        .eq("is_primary", true);
    }

    const { error } = await supabase.from("station_memberships").insert({
      profile_id: resolvedProfileId,
      station_id: stationId,
      crew_type_id: crewTypeId || null,
      membership_role: membershipRole,
      is_primary: isPrimary,
      is_active: isActive,
    });

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  }

  revalidatePath("/admin/crew");
  redirectWithFeedback(returnPath, membershipId ? "Membership updated." : "Membership created.", stationId);
}

export async function saveOperationalRoleAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/roles");
  requireSuperAdmin(context);

  const roleId = getFormString(formData, "operational_role_id");
  const code = getFormString(formData, "code");
  const name = getFormString(formData, "name");
  const description = getFormString(formData, "description") || null;
  const category = getFormString(formData, "category") || "operational";
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/roles");

  if (!code || !name) {
    redirectWithFeedback(returnPath, "Code and name are required.");
  }

  if (roleId) {
    const { error } = await supabase
      .from("operational_roles")
      .update({
        code,
        name,
        description,
        category,
        is_active: isActive,
      })
      .eq("id", roleId);

    if (error) {
      redirectWithFeedback(returnPath, error.message);
    }
  } else {
    const { error } = await supabase.from("operational_roles").insert({
      code,
      name,
      description,
      category,
      is_active: isActive,
    });

    if (error) {
      redirectWithFeedback(returnPath, error.message);
    }
  }

  revalidatePath("/admin/roles");
  redirectWithFeedback(returnPath, roleId ? "Operational role updated." : "Operational role created.");
}

export async function saveRoleAssignmentAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/roles");
  const stationId = getFormString(formData, "station_id");
  const assignmentId = getFormString(formData, "assignment_id");
  const profileId = getFormString(formData, "profile_id");
  const assetId = getFormString(formData, "asset_id");
  const operationalRoleId = getFormString(formData, "operational_role_id");
  const currencyState = getFormString(formData, "currency_state") as "green" | "amber" | "red";
  const notes = getFormString(formData, "notes") || null;
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/roles");

  if (!stationId || !profileId || !assetId || !operationalRoleId) {
    redirectWithFeedback(returnPath, "Station, crew member, asset, and role are required.");
  }

  requireStationAccess(context, stationId);

  const assetTypeId = await loadStationAssetTypeId(supabase, assetId);

  if (assignmentId) {
    const { error } = await supabase
      .from("crew_qualifications")
      .update({
        profile_id: profileId,
        station_id: stationId,
        asset_id: assetId,
        asset_type_id: assetTypeId,
        operational_role_id: operationalRoleId,
        qualification_type_id: null,
        currency_state: currencyState,
        notes,
        is_active: isActive,
      })
      .eq("id", assignmentId);

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  } else {
    const { error } = await supabase.from("crew_qualifications").insert({
      profile_id: profileId,
      station_id: stationId,
      asset_id: assetId,
      asset_type_id: assetTypeId,
      operational_role_id: operationalRoleId,
      qualification_type_id: null,
      currency_state: currencyState,
      starts_on: new Date().toISOString().slice(0, 10),
      notes,
      is_active: isActive,
    });

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  }

  revalidatePath("/admin/roles");
  redirectWithFeedback(returnPath, assignmentId ? "Role assignment updated." : "Role assignment created.", stationId);
}

export async function saveQualificationAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/qualifications");
  const stationId = getFormString(formData, "station_id");
  const qualificationId = getFormString(formData, "qualification_id");
  const profileId = getFormString(formData, "profile_id");
  const qualificationTypeId = getFormString(formData, "qualification_type_id");
  const currencyState = getFormString(formData, "currency_state") as "green" | "amber" | "red";
  const startsOn = getFormString(formData, "starts_on") || new Date().toISOString().slice(0, 10);
  const expiresOn = getFormString(formData, "expires_on") || null;
  const notes = getFormString(formData, "notes") || null;
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/qualifications");

  if (!stationId || !profileId || !qualificationTypeId) {
    redirectWithFeedback(returnPath, "Station, crew member, and qualification type are required.");
  }

  requireStationAccess(context, stationId);

  if (qualificationId) {
    const { error } = await supabase
      .from("crew_qualifications")
      .update({
        profile_id: profileId,
        station_id: stationId,
        qualification_type_id: qualificationTypeId,
        operational_role_id: null,
        asset_id: null,
        asset_type_id: null,
        currency_state: currencyState,
        starts_on: startsOn,
        expires_on: expiresOn,
        notes,
        is_active: isActive,
      })
      .eq("id", qualificationId);

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  } else {
    const { error } = await supabase.from("crew_qualifications").insert({
      profile_id: profileId,
      station_id: stationId,
      qualification_type_id: qualificationTypeId,
      operational_role_id: null,
      asset_id: null,
      asset_type_id: null,
      currency_state: currencyState,
      starts_on: startsOn,
      expires_on: expiresOn,
      notes,
      is_active: isActive,
    });

    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  }

  revalidatePath("/admin/qualifications");
  redirectWithFeedback(returnPath, qualificationId ? "Qualification updated." : "Qualification created.", stationId);
}
