"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  buildRedirectUrl,
  getFormString,
  getAdminAccessContext,
} from "@/lib/admin-crud";
import { getCurrentUserContext } from "@/lib/auth";
import {
  evaluateCoverEligibility,
  type CoverRequestRecord,
  type CoverRequestCandidate,
  type CoverResponseStatus,
} from "@/lib/cover-requests";

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

function getFirstRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatCoverMessage(request: Pick<CoverRequestRecord, "reason" | "cover_type" | "starts_at" | "ends_at">) {
  return `${request.cover_type.replace(/_/g, " ")} cover requested from ${request.starts_at} to ${request.ends_at}: ${request.reason}`;
}

function requireStationMembership(
  context: Awaited<ReturnType<typeof getCurrentUserContext>>,
  stationId: string,
) {
  if (context.isSuperAdmin) {
    return;
  }

  const hasStationMembership = context.memberships.some(
    (membership) => membership.station_id === stationId && membership.is_active,
  );

  if (!hasStationMembership) {
    redirect(
      buildRedirectUrl("/unauthorized", {
        reason: "Cover requests are restricted to your own station membership.",
      }),
    );
  }
}

async function loadOwnMembershipForStation(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
  stationId: string,
) {
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
    .eq("profile_id", profileId)
    .eq("station_id", stationId)
    .eq("is_active", true)
    .maybeSingle();

  return data ?? null;
}

async function loadRequestForAction(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  coverRequestId: string,
) {
  const { data } = await supabase
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
        updated_at,
        requester:profiles (
          id,
          display_name,
          email,
          phone,
          system_role,
          is_active
        )
      `,
    )
    .eq("id", coverRequestId)
    .maybeSingle();

  return data as CoverRequestRecord | null;
}

async function loadResponderCandidate(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  profileId: string,
  stationId: string,
): Promise<CoverRequestCandidate | null> {
  const [membership, availabilityResult, dutyPeriodsResult, qualificationsResult] = await Promise.all([
    loadOwnMembershipForStation(supabase, profileId, stationId),
    supabase
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
          created_by_profile_id
        `,
      )
      .eq("profile_id", profileId)
      .eq("station_id", stationId),
    supabase
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
      .eq("profile_id", profileId)
      .eq("station_id", stationId),
    supabase
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
          is_active
        `,
      )
      .eq("profile_id", profileId)
      .eq("station_id", stationId),
  ]);

  if (!membership) {
    return null;
  }

  const profile = membership.profile && !Array.isArray(membership.profile) ? membership.profile : null;
  if (!profile) {
    return null;
  }

  return {
    profile,
    membership,
    availabilitySlots: (availabilityResult.data ?? []) as CoverRequestCandidate["availabilitySlots"],
    dutyPeriods: (dutyPeriodsResult.data ?? []) as CoverRequestCandidate["dutyPeriods"],
    qualifications: (qualificationsResult.data ?? []) as CoverRequestCandidate["qualifications"],
  };
}

async function writeNotification(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    stationId: string;
    organisationId: string | null;
    relatedId: string;
    type: string;
    title: string;
    body: string;
    priority?: number;
  },
) {
  await supabase.from("notifications").insert({
    organisation_id: params.organisationId,
    station_id: params.stationId,
    recipient_profile_id: null,
    channel: "in_app",
    notification_type: params.type,
    title: params.title,
    body: params.body,
    priority: params.priority ?? 0,
    status: "queued",
    related_table: "cover_requests",
    related_id: params.relatedId,
    created_by_profile_id: null,
  });
}

async function writeAuditLog(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    organisationId: string | null;
    stationId: string;
    actorProfileId: string;
    action: string;
    entityId: string;
    beforeData?: Record<string, unknown>;
    afterData?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("audit_log").insert({
    organisation_id: params.organisationId,
    station_id: params.stationId,
    actor_profile_id: params.actorProfileId,
    action: params.action,
    entity_table: "cover_requests",
    entity_id: params.entityId,
    before_data: params.beforeData ?? {},
    after_data: params.afterData ?? {},
    metadata: params.metadata ?? {},
  });
}

function revalidateCoverPaths() {
  revalidatePath("/");
  revalidatePath("/crew");
  revalidatePath("/crew/cover");
  revalidatePath("/crew/rota");
  revalidatePath("/dla");
  revalidatePath("/admin");
  revalidatePath("/admin/cover");
  revalidatePath("/admin/duty-rota");
  revalidatePath("/admin/readiness");
}

export async function saveCoverRequestAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const stationId = getFormString(formData, "station_id");
  const originalDutyPeriodId = getFormString(formData, "original_duty_period_id") || null;
  const assetId = getFormString(formData, "asset_id") || null;
  const operationalRoleId = getFormString(formData, "operational_role_id") || null;
  const crewTypeId = getFormString(formData, "crew_type_id") || null;
  const coverType = getFormString(formData, "cover_type") as "weekend" | "day" | "night" | "custom";
  const startsAt = getFormString(formData, "starts_at");
  const endsAt = getFormString(formData, "ends_at");
  const urgency = getFormString(formData, "urgency") as "normal" | "urgent";
  const reason = getFormString(formData, "reason");
  const notes = getFormString(formData, "notes") || null;
  const returnPath = getReturnPath(formData, "/crew/cover");

  if (!context.user || !context.profile || !context.isAuthenticated) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  if (!stationId) {
    redirectWithFeedback(returnPath, "Station is required.");
  }

  requireStationMembership(context, stationId);

  if (!coverType || !startsAt || !endsAt || !reason) {
    redirectWithFeedback(returnPath, "Cover type, times, and reason are required.", stationId);
  }

  const { data, error } = await supabase
    .from("cover_requests")
    .insert({
      station_id: stationId,
      requester_profile_id: profile.id,
      original_duty_period_id: originalDutyPeriodId || null,
      asset_id: assetId || null,
      operational_role_id: operationalRoleId || null,
      crew_type_id: crewTypeId || null,
      cover_type: coverType,
      starts_at: new Date(startsAt).toISOString(),
      ends_at: new Date(endsAt).toISOString(),
      status: "open",
      urgency: urgency || "normal",
      reason,
      notes,
    })
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
        notes
      `,
    )
    .single();

  if (error || !data) {
    redirectWithFeedback(returnPath, error?.message ?? "Could not create the cover request.", stationId);
  }
  const createdRequest = data as NonNullable<typeof data>;

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId,
    actorProfileId: profile.id,
    action: "cover_request_created",
    entityId: createdRequest.id,
    afterData: createdRequest as Record<string, unknown>,
    metadata: {
      original_duty_period_id: originalDutyPeriodId,
      asset_id: assetId,
      operational_role_id: operationalRoleId,
      crew_type_id: crewTypeId,
      urgency: urgency || "normal",
    },
  });

  await writeNotification(supabase, {
    organisationId: profile.organisation_id,
    stationId,
    relatedId: createdRequest.id,
    type: urgency === "urgent" ? "urgent_cover_request" : "cover_request_created",
    title: urgency === "urgent" ? "Urgent cover request" : "Cover request created",
    body: formatCoverMessage(createdRequest),
    priority: urgency === "urgent" ? 10 : 0,
  });

  revalidateCoverPaths();
  redirectWithFeedback(returnPath, "Cover request created.", stationId);
}

export async function saveCoverResponseAction(formData: FormData) {
  const mode = getFormString(formData, "mode") || "self";
  const responseId = getFormString(formData, "response_id") || null;
  const coverRequestId = getFormString(formData, "cover_request_id");
  const responseStatus = getFormString(formData, "response_status") as CoverResponseStatus;
  const notes = getFormString(formData, "notes") || null;
  const returnPath = getReturnPath(formData, "/crew/cover");

  if (!coverRequestId || !responseStatus) {
    redirectWithFeedback(returnPath, "Cover request and response status are required.");
  }

  const supabase = await createSupabaseServerClient();
  const request = await loadRequestForAction(supabase, coverRequestId);

  if (!request) {
    redirectWithFeedback(returnPath, "Cover request could not be found.");
  }

  const coverRequest = request as NonNullable<typeof request>;

  const requester = getFirstRecord(coverRequest.requester);
  if (!requester) {
    redirectWithFeedback(returnPath, "Requester profile could not be resolved.", coverRequest.station_id);
  }

  if (mode === "confirm") {
    const { context } = await getAdminAccessContext("/admin/cover");

    if (!context.profile || !context.isAuthenticated) {
      redirectWithFeedback(returnPath, "Sign in required.", coverRequest.station_id);
    }
    const adminProfile = context.profile as NonNullable<typeof context.profile>;

    const targetResponseId = responseId;
    if (!targetResponseId) {
      redirectWithFeedback(returnPath, "A response is required for confirmation.", coverRequest.station_id);
    }

    const { data: existingResponse } = await supabase
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
          responded_at
        `,
      )
      .eq("id", targetResponseId)
      .maybeSingle();

    if (!existingResponse) {
      redirectWithFeedback(returnPath, "Response could not be found.", coverRequest.station_id);
    }
    const coverResponse = existingResponse as NonNullable<typeof existingResponse>;

    const { error: responseError } = await supabase
      .from("cover_request_responses")
      .update({
        response_status: "accepted",
        responded_at: new Date().toISOString(),
        notes,
      })
      .eq("id", targetResponseId);

    if (responseError) {
      redirectWithFeedback(returnPath, responseError.message, coverRequest.station_id);
    }

    const { error: requestError } = await supabase
      .from("cover_requests")
      .update({
        status: "accepted",
        accepted_by_profile_id: coverResponse.responder_profile_id,
        accepted_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      })
      .eq("id", coverRequestId);

    if (requestError) {
      redirectWithFeedback(returnPath, requestError.message, coverRequest.station_id);
    }

    await writeAuditLog(supabase, {
      organisationId: adminProfile.organisation_id,
      stationId: coverRequest.station_id,
      actorProfileId: adminProfile.id,
      action: "cover_request_admin_confirmed",
      entityId: coverRequest.id,
      beforeData: { status: coverRequest.status },
      afterData: { status: "accepted", responder_profile_id: coverResponse.responder_profile_id },
      metadata: {
        response_id: targetResponseId,
      },
    });

    await writeNotification(supabase, {
      organisationId: adminProfile.organisation_id,
      stationId: coverRequest.station_id,
      relatedId: coverRequest.id,
      type: "cover_request_accepted",
      title: "Cover request accepted",
      body: `A cover request for ${coverRequest.cover_type.replace(/_/g, " ")} cover was accepted.`,
      priority: 5,
    });

    revalidateCoverPaths();
    redirectWithFeedback(returnPath, "Cover request confirmed.", coverRequest.station_id);
  }

  const context = await getCurrentUserContext();
  if (!context.user || !context.profile || !context.isAuthenticated) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  requireStationMembership(context, coverRequest.station_id);

  const currentCandidate = await loadResponderCandidate(supabase, profile.id, coverRequest.station_id);
  const eligibility = evaluateCoverEligibility(currentCandidate, coverRequest);

  if (responseStatus === "accepted" && !eligibility.eligible) {
    redirectWithFeedback(
      returnPath,
      `This cover cannot be accepted automatically: ${eligibility.notes.join(" ")}`,
      coverRequest.station_id,
    );
  }

  if (responseStatus === "offered" && eligibility.status === "ineligible") {
    redirectWithFeedback(
      returnPath,
      `This cover cannot be offered automatically: ${eligibility.notes.join(" ")}`,
      coverRequest.station_id,
    );
  }

  const { error: responseUpsertError } = await supabase.from("cover_request_responses").upsert(
    {
      id: responseId || undefined,
      cover_request_id: coverRequest.id,
      responder_profile_id: profile.id,
      response_status: responseStatus,
      eligibility_status: eligibility.status,
      eligibility_notes: eligibility.notes.join(" "),
      notes,
      responded_at: new Date().toISOString(),
    },
    {
      onConflict: "cover_request_id,responder_profile_id",
    },
  );

  if (responseUpsertError) {
    redirectWithFeedback(returnPath, responseUpsertError.message, coverRequest.station_id);
  }

  if (responseStatus === "accepted" && eligibility.eligible) {
    const { error: requestUpdateError } = await supabase
      .from("cover_requests")
      .update({
        status: "accepted",
        accepted_by_profile_id: profile.id,
        accepted_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      })
      .eq("id", coverRequest.id);

    if (requestUpdateError) {
      redirectWithFeedback(returnPath, requestUpdateError.message, coverRequest.station_id);
    }
  }

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId: coverRequest.station_id,
    actorProfileId: profile.id,
    action:
      responseStatus === "accepted"
        ? "cover_request_response_accepted"
        : responseStatus === "withdrawn"
          ? "cover_request_response_withdrawn"
          : responseStatus === "rejected"
            ? "cover_request_response_rejected"
            : "cover_request_response_offered",
    entityId: coverRequest.id,
    afterData: {
      response_status: responseStatus,
      eligibility_status: eligibility.status,
      eligibility_notes: eligibility.notes,
    },
    metadata: {
      responder_profile_id: profile.id,
      response_id: responseId,
    },
  });

  await writeNotification(supabase, {
    organisationId: profile.organisation_id,
    stationId: coverRequest.station_id,
    relatedId: coverRequest.id,
    type:
      responseStatus === "accepted"
        ? "cover_request_accepted"
        : responseStatus === "withdrawn"
          ? "cover_request_withdrawn"
          : responseStatus === "rejected"
            ? "cover_request_rejected"
            : "cover_request_response_offered",
    title:
      responseStatus === "accepted"
        ? "Cover accepted"
        : responseStatus === "withdrawn"
          ? "Cover withdrawn"
          : responseStatus === "rejected"
            ? "Cover rejected"
            : "Cover offered",
    body: `Cover request response ${responseStatus} for ${coverRequest.cover_type.replace(/_/g, " ")} cover.`,
    priority: responseStatus === "accepted" ? 5 : 0,
  });

  revalidateCoverPaths();
  redirectWithFeedback(
    returnPath,
    responseStatus === "accepted" ? "Cover accepted." : "Cover response recorded.",
    coverRequest.station_id,
  );
}

export async function cancelCoverRequestAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const coverRequestId = getFormString(formData, "cover_request_id");
  const notes = getFormString(formData, "notes") || null;
  const returnPath = getReturnPath(formData, "/crew/cover");

  if (!coverRequestId) {
    redirectWithFeedback(returnPath, "Cover request is required.");
  }

  const request = await loadRequestForAction(supabase, coverRequestId);
  if (!request) {
    redirectWithFeedback(returnPath, "Cover request could not be found.");
  }
  const coverRequest = request as NonNullable<typeof request>;

  const canCancel =
    context.isSuperAdmin ||
    context.canAccessAdmin ||
    coverRequest.requester_profile_id === context.user?.id;

  if (!canCancel) {
    redirectWithFeedback(returnPath, "You cannot cancel this cover request.", coverRequest.station_id);
  }

  if (!context.profile) {
    redirectWithFeedback(returnPath, "Sign in required.", coverRequest.station_id);
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  const { error } = await supabase
    .from("cover_requests")
    .update({
      status: "cancelled",
      resolved_at: new Date().toISOString(),
      notes: notes ?? coverRequest.notes,
    })
    .eq("id", coverRequest.id);

  if (error) {
    redirectWithFeedback(returnPath, error.message, coverRequest.station_id);
  }

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId: coverRequest.station_id,
    actorProfileId: profile.id,
    action: "cover_request_cancelled",
    entityId: coverRequest.id,
    beforeData: { status: coverRequest.status },
    afterData: { status: "cancelled" },
    metadata: { notes },
  });

  await writeNotification(supabase, {
    organisationId: profile.organisation_id,
    stationId: coverRequest.station_id,
    relatedId: coverRequest.id,
    type: "cover_request_cancelled",
    title: "Cover request cancelled",
    body: formatCoverMessage(coverRequest),
    priority: 0,
  });

  revalidateCoverPaths();
  redirectWithFeedback(returnPath, "Cover request cancelled.", coverRequest.station_id);
}
