"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRedirectUrl, getFormString, parseBoolean, requireStationAccess, getAdminAccessContext } from "@/lib/admin-crud";

function redirectWithFeedback(pathname: string, feedback: string, stationId?: string | null) {
  redirect(
    buildRedirectUrl(pathname, {
      success: feedback,
      stationId: stationId ?? undefined,
    }),
  );
}

function parseIsoDateTime(dateValue: string, timeValue: string) {
  if (!dateValue || !timeValue) {
    return null;
  }

  const asDate = new Date(`${dateValue}T${timeValue}:00`);
  return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
}

function getDatePart(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function getReturnPath(formData: FormData, fallback: string) {
  const value = getFormString(formData, "return_path");
  return value || fallback;
}

function requireCrewStationAccess(context: Awaited<ReturnType<typeof getCurrentUserContext>>, stationId: string) {
  if (context.isSuperAdmin) {
    return;
  }

  const hasStationMembership = context.memberships.some(
    (membership) => membership.station_id === stationId && membership.is_active,
  );

  if (!hasStationMembership) {
    redirect(
      buildRedirectUrl("/unauthorized", {
        reason: "Crew availability is restricted to your own station membership.",
      }),
    );
  }
}

export async function saveCrewAvailabilityAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const slotId = getFormString(formData, "slot_id");
  const stationId = getFormString(formData, "station_id");
  const slotKind = getFormString(formData, "slot_kind") as
    | "full_day"
    | "partial_day"
    | "night_cover"
    | "unavailable"
    | "weekend_unavailable";
  const coverageDate = getFormString(formData, "coverage_date") || null;
  const startTime = getFormString(formData, "start_time");
  const endTime = getFormString(formData, "end_time");
  const explicitStartsAt = getFormString(formData, "starts_at") || null;
  const explicitEndsAt = getFormString(formData, "ends_at") || null;
  const stationLocationId = getFormString(formData, "station_location_id") || null;
  const assetTypeId = getFormString(formData, "asset_type_id") || null;
  const assetId = getFormString(formData, "asset_id") || null;
  const operationalRoleId = getFormString(formData, "operational_role_id") || null;
  const notes = getFormString(formData, "notes") || null;
  const isRecurring = parseBoolean(formData.get("is_recurring"));
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/crew/availability");

  if (!context.user || !context.isAuthenticated || !context.profile) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }

  const profile = context.profile;
  if (!profile) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const currentProfile = profile!;

  if (!stationId) {
    redirectWithFeedback(returnPath, "Station is required.");
  }

  requireCrewStationAccess(context, stationId);

  const parsedStartsAt = explicitStartsAt || parseIsoDateTime(coverageDate ?? "", startTime);
  const parsedEndsAt = explicitEndsAt || parseIsoDateTime(coverageDate ?? "", endTime);

  if (!slotKind || !parsedStartsAt || !parsedEndsAt) {
    redirectWithFeedback(returnPath, "Availability window is required.", stationId);
  }

  const startsAtValue = parsedStartsAt!;
  const endsAtValue = parsedEndsAt!;

  const payload = {
    profile_id: currentProfile.id,
    station_id: stationId,
    station_location_id: stationLocationId,
    asset_type_id: assetTypeId,
    asset_id: assetId,
    operational_role_id: operationalRoleId,
    slot_kind: slotKind,
    coverage_date: coverageDate ?? getDatePart(startsAtValue),
    start_time: startTime || startsAtValue.slice(11, 16),
    end_time: endTime || endsAtValue.slice(11, 16),
    starts_at: startsAtValue,
    ends_at: endsAtValue,
    is_recurring: isRecurring,
    is_active: isActive,
    notes,
    created_by_profile_id: currentProfile.id,
  };

  if (slotId) {
    const { error } = await supabase.from("availability_slots").update(payload).eq("id", slotId);
    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  } else {
    const { error } = await supabase.from("availability_slots").insert(payload);
    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  }

  revalidatePath("/crew/availability");
  revalidatePath("/crew/rota");
  redirectWithFeedback(returnPath, slotId ? "Availability updated." : "Availability created.", stationId);
}

export async function saveStationAvailabilityAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/availability");
  const slotId = getFormString(formData, "slot_id");
  const stationId = getFormString(formData, "station_id");
  const profileId = getFormString(formData, "profile_id");
  const slotKind = getFormString(formData, "slot_kind") as
    | "full_day"
    | "partial_day"
    | "night_cover"
    | "unavailable"
    | "weekend_unavailable";
  const coverageDate = getFormString(formData, "coverage_date") || null;
  const startTime = getFormString(formData, "start_time");
  const endTime = getFormString(formData, "end_time");
  const explicitStartsAt = getFormString(formData, "starts_at") || null;
  const explicitEndsAt = getFormString(formData, "ends_at") || null;
  const stationLocationId = getFormString(formData, "station_location_id") || null;
  const assetTypeId = getFormString(formData, "asset_type_id") || null;
  const assetId = getFormString(formData, "asset_id") || null;
  const operationalRoleId = getFormString(formData, "operational_role_id") || null;
  const notes = getFormString(formData, "notes") || null;
  const isRecurring = parseBoolean(formData.get("is_recurring"));
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/availability");

  if (!stationId) {
    redirectWithFeedback(returnPath, "Station is required.");
  }

  requireStationAccess(context, stationId);

  const parsedStartsAt = explicitStartsAt || parseIsoDateTime(coverageDate ?? "", startTime);
  const parsedEndsAt = explicitEndsAt || parseIsoDateTime(coverageDate ?? "", endTime);

  if (!slotKind || !parsedStartsAt || !parsedEndsAt) {
    redirectWithFeedback(returnPath, "Availability window is required.", stationId);
  }

  const startsAtValue = parsedStartsAt!;
  const endsAtValue = parsedEndsAt!;

  const payload = {
    profile_id: profileId || null,
    station_id: stationId,
    station_location_id: stationLocationId,
    asset_type_id: assetTypeId,
    asset_id: assetId,
    operational_role_id: operationalRoleId,
    slot_kind: slotKind,
    coverage_date: coverageDate ?? getDatePart(startsAtValue),
    start_time: startTime || startsAtValue.slice(11, 16),
    end_time: endTime || endsAtValue.slice(11, 16),
    starts_at: startsAtValue,
    ends_at: endsAtValue,
    is_recurring: isRecurring,
    is_active: isActive,
    notes,
    created_by_profile_id: context.profile?.id ?? null,
  };

  if (slotId) {
    const { error } = await supabase.from("availability_slots").update(payload).eq("id", slotId).eq("station_id", stationId);
    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  } else {
    const { error } = await supabase.from("availability_slots").insert(payload);
    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  }

  revalidatePath("/admin/availability");
  redirectWithFeedback(returnPath, slotId ? "Station availability updated." : "Station availability created.", stationId);
}

export async function saveDutyPeriodAction(formData: FormData) {
  const { context, supabase } = await getAdminAccessContext("/admin/duty-rota");
  const periodId = getFormString(formData, "period_id");
  const stationId = getFormString(formData, "station_id");
  const profileId = getFormString(formData, "profile_id") || null;
  const periodKind = getFormString(formData, "period_kind") as
    | "day_cover"
    | "night_cover"
    | "launch_alert"
    | "incident_cover"
    | "training"
    | "weekend_cover"
    | "dla_day"
    | "dla_night";
  const dutyDate = getFormString(formData, "duty_date") || null;
  const startTime = getFormString(formData, "start_time");
  const endTime = getFormString(formData, "end_time");
  const explicitStartsAt = getFormString(formData, "starts_at") || null;
  const explicitEndsAt = getFormString(formData, "ends_at") || null;
  const stationLocationId = getFormString(formData, "station_location_id") || null;
  const assetTypeId = getFormString(formData, "asset_type_id") || null;
  const assetId = getFormString(formData, "asset_id") || null;
  const operationalRoleId = getFormString(formData, "operational_role_id") || null;
  const source = getFormString(formData, "source") || "manual";
  const notes = getFormString(formData, "notes") || null;
  const isActive = parseBoolean(formData.get("is_active"));
  const returnPath = getReturnPath(formData, "/admin/duty-rota");

  if (!stationId) {
    redirectWithFeedback(returnPath, "Station is required.");
  }

  requireStationAccess(context, stationId);

  if (!periodKind || !dutyDate || !startTime || !endTime) {
    redirectWithFeedback(returnPath, "Duty date, start time, end time, and period kind are required.", stationId);
  }

  const parsedStartsAt = explicitStartsAt || parseIsoDateTime(dutyDate!, startTime);
  const parsedEndsAt = explicitEndsAt || parseIsoDateTime(dutyDate!, endTime);

  if (!parsedStartsAt || !parsedEndsAt) {
    redirectWithFeedback(returnPath, "Duty period window is required.", stationId);
  }

  const payload = {
    station_id: stationId,
    profile_id: profileId,
    station_location_id: stationLocationId,
    asset_type_id: assetTypeId,
    asset_id: assetId,
    operational_role_id: operationalRoleId,
    period_kind: periodKind,
    duty_date: dutyDate,
    start_time: startTime,
    end_time: endTime,
    starts_at: parsedStartsAt,
    ends_at: parsedEndsAt,
    source,
    notes,
    is_active: isActive,
    created_by_profile_id: context.profile?.id ?? null,
  };

  if (periodId) {
    const { error } = await supabase.from("duty_periods").update(payload).eq("id", periodId).eq("station_id", stationId);
    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  } else {
    const { error } = await supabase.from("duty_periods").insert(payload);
    if (error) {
      redirectWithFeedback(returnPath, error.message, stationId);
    }
  }

  revalidatePath("/admin/duty-rota");
  revalidatePath("/crew/rota");
  redirectWithFeedback(returnPath, periodId ? "Duty period updated." : "Duty period created.", stationId);
}
