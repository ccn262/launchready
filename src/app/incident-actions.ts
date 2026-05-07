"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildRedirectUrl, getFormString } from "@/lib/admin-crud";
import { getCurrentUserContext } from "@/lib/auth";
import { loadCoverRequestOverview } from "@/lib/cover-requests";
import { buildIncidentReadinessSnapshot, type IncidentRecord, type IncidentResponseStatus } from "@/lib/incidents";
import { loadReadinessSnapshot } from "@/lib/readiness";

function redirectWithFeedback(pathname: string, feedback: string, stationId?: string | null) {
  redirect(
    buildRedirectUrl(pathname, {
      success: feedback,
      stationId: stationId ?? undefined,
    }),
  );
}

function getReturnPath(formData: FormData, fallback: string) {
  return getFormString(formData, "return_path") || fallback;
}

function parseMultiValue(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
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
        reason: "This station is outside your management scope.",
      }),
    );
  }
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
    entity_table: "incidents",
    entity_id: params.entityId,
    before_data: params.beforeData ?? {},
    after_data: params.afterData ?? {},
    metadata: params.metadata ?? {},
  });
}

async function writeNotification(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  params: {
    organisationId: string | null;
    stationId: string;
    relatedId: string;
    type: string;
    title: string;
    body: string;
    priority?: number;
    recipientProfileId?: string | null;
    actorProfileId?: string | null;
  },
) {
  await supabase.from("notifications").insert({
    organisation_id: params.organisationId,
    station_id: params.stationId,
    recipient_profile_id: params.recipientProfileId ?? null,
    channel: "in_app",
    notification_type: params.type,
    title: params.title,
    body: params.body,
    priority: params.priority ?? 0,
    status: "queued",
    related_table: "incidents",
    related_id: params.relatedId,
    created_by_profile_id: params.actorProfileId ?? null,
  });
}

async function loadIncidentForAction(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  incidentId: string,
) {
  const { data } = await supabase
    .from("incidents")
    .select(
      `
        id,
        organisation_id,
        station_id,
        station_location_id,
        reported_by_profile_id,
        launch_authority_profile_id,
        status,
        operation_type,
        incident_type,
        title,
        summary,
        location_notes,
        dynamic_risk_assessment_notes,
        readiness_snapshot,
        selected_asset_ids,
        drafted_at,
        initiated_at,
        launched_at,
        stood_down_at,
        closed_at,
        cancelled_at,
        is_active,
        created_at,
        updated_at
      `,
    )
    .eq("id", incidentId)
    .maybeSingle();

  return (data as IncidentRecord | null) ?? null;
}

async function loadIncidentCrewRecipients(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  stationId: string,
) {
  const { data } = await supabase
    .from("station_memberships")
    .select(
      `
        profile_id,
        is_active,
        profile:profiles (
          id,
          display_name,
          email,
          phone,
          system_role,
          is_active
        )
      `,
    )
    .eq("station_id", stationId)
    .eq("is_active", true);

  const recipients = ((data ?? []) as Array<Record<string, unknown>>)
    .map((membership) => {
      const profile = membership.profile as
        | {
            id: string;
            display_name: string | null;
            email: string | null;
            phone: string | null;
            system_role: string;
            is_active: boolean;
          }
        | Array<{
            id: string;
            display_name: string | null;
            email: string | null;
            phone: string | null;
            system_role: string;
            is_active: boolean;
          }>
        | null
        | undefined;
      const resolvedProfile = Array.isArray(profile) ? profile[0] ?? null : profile ?? null;
      if (!resolvedProfile || !resolvedProfile.is_active) {
        return null;
      }

      return resolvedProfile;
    })
    .filter(
      (
        profile,
      ): profile is {
        id: string;
        display_name: string | null;
        email: string | null;
        phone: string | null;
        system_role: string;
        is_active: boolean;
      } => Boolean(profile),
    );

  return Array.from(new Map(recipients.map((profile) => [profile.id, profile])).values());
}

export async function saveIncidentDraftAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const returnPath = getReturnPath(formData, "/dla/launch");
  const stationId = getFormString(formData, "station_id");
  const stationLocationId = getFormString(formData, "station_location_id") || null;
  const operationType = getFormString(formData, "operation_type") as IncidentRecord["operation_type"];
  const incidentType = getFormString(formData, "incident_type") || "launch";
  const title = getFormString(formData, "title");
  const notes = getFormString(formData, "notes") || null;
  const dynamicRiskAssessmentNotes = getFormString(formData, "dynamic_risk_assessment_notes") || null;
  const selectedAssetIds = parseMultiValue(formData, "asset_ids");

  if (!context.user || !context.profile || !context.isAuthenticated) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  if (!stationId || !title || !operationType) {
    redirectWithFeedback(returnPath, "Station, title, and operation type are required.");
  }

  requireStationMembership(context, stationId);

  if (!selectedAssetIds.length) {
    redirectWithFeedback(returnPath, "Select at least one asset to create a launch draft.", stationId);
  }

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      organisation_id: profile.organisation_id,
      station_id: stationId,
      station_location_id: stationLocationId,
      reported_by_profile_id: profile.id,
      launch_authority_profile_id: profile.id,
      status: "open",
      operation_type: operationType,
      incident_type: incidentType,
      title,
      summary: notes,
      location_notes: null,
      dynamic_risk_assessment_notes: dynamicRiskAssessmentNotes,
      readiness_snapshot: {
        selected_asset_ids: selectedAssetIds,
        incident_type: incidentType,
        operation_type: operationType,
        station_location_id: stationLocationId,
      },
      selected_asset_ids: selectedAssetIds,
      drafted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    redirectWithFeedback(returnPath, error?.message ?? "Could not create the launch draft.", stationId);
  }
  const createdIncident = data as NonNullable<typeof data>;

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId,
    actorProfileId: profile.id,
    action: "incident_draft_created",
    entityId: createdIncident.id,
    afterData: {
      station_location_id: stationLocationId,
      operation_type: operationType,
      incident_type: incidentType,
      title,
      selected_asset_ids: selectedAssetIds,
    },
  });

  const recipients = await loadIncidentCrewRecipients(supabase, stationId);
  await Promise.all(
    recipients.map((recipient) =>
      writeNotification(supabase, {
        organisationId: profile.organisation_id,
        stationId,
        relatedId: createdIncident.id,
        type: "incident_created",
        title: "Launch draft created",
        body: `${title} was created as a draft incident.`,
        recipientProfileId: recipient.id,
        actorProfileId: profile.id,
      }),
    ),
  );

  revalidatePath("/dla/launch");
  revalidatePath("/dla/incidents");
  revalidatePath("/dla");
  revalidatePath("/crew/incidents");
  revalidatePath("/");

  redirectWithFeedback(returnPath, "Launch draft created.", stationId);
}

export async function initiateIncidentAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const returnPath = getReturnPath(formData, "/dla/launch");
  const incidentId = getFormString(formData, "incident_id");

  if (!incidentId) {
    redirectWithFeedback(returnPath, "Incident draft is required.");
  }

  if (!context.user || !context.profile || !context.isAuthenticated) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  const incident = await loadIncidentForAction(supabase, incidentId);
  if (!incident) {
    redirectWithFeedback(returnPath, "Incident draft could not be found.");
  }
  const incidentRecord = incident as NonNullable<typeof incident>;

  requireStationMembership(context, incidentRecord.station_id);

  if (incidentRecord.status !== "open") {
    redirectWithFeedback(returnPath, "Only draft incidents can be initiated.", incidentRecord.station_id);
  }

  const selectedAssetIds = incidentRecord.selected_asset_ids;
  if (!selectedAssetIds.length) {
    redirectWithFeedback(returnPath, "Select at least one asset before initiating the launch.", incidentRecord.station_id);
  }

  const readiness = await loadReadinessSnapshot({
    pathname: "/dla/launch",
    requestedStationId: incidentRecord.station_id,
    operationType: incidentRecord.operation_type,
    windowPreset: "current",
  });
  const coverOverview = await loadCoverRequestOverview("/dla/launch", incidentRecord.station_id);
  const allAssets = readiness.stationSummary?.locations.flatMap((location) => location.assets) ?? [];
  const selectedAssetSummaries = allAssets.filter((asset) => selectedAssetIds.includes(asset.asset.id));
  if (!selectedAssetSummaries.length) {
    redirectWithFeedback(returnPath, "No selected assets could be resolved in the readiness snapshot.", incidentRecord.station_id);
  }

  const readinessSnapshot = buildIncidentReadinessSnapshot({
    snapshot: readiness,
    coverRequestCount: coverOverview.openCount,
    selectedAssetSummaries,
    operationType: incidentRecord.operation_type,
  });

  const { error: updateError } = await supabase
    .from("incidents")
    .update({
      status: "active",
      launch_authority_profile_id: profile.id,
      readiness_snapshot: readinessSnapshot as Record<string, unknown>,
      launched_at: new Date().toISOString(),
      initiated_at: new Date().toISOString(),
      is_active: true,
    })
    .eq("id", incidentRecord.id);

  if (updateError) {
    redirectWithFeedback(returnPath, updateError.message, incidentRecord.station_id);
  }

  const { error: assetDeleteError } = await supabase.from("incident_assets").delete().eq("incident_id", incidentRecord.id);
  if (assetDeleteError) {
    redirectWithFeedback(returnPath, assetDeleteError.message, incidentRecord.station_id);
  }

  const { error: assetInsertError } = await supabase.from("incident_assets").insert(
    selectedAssetSummaries.map((asset) => ({
      incident_id: incidentRecord.id,
      asset_id: asset.asset.id,
      readiness_status_at_initiation: asset.status,
      readiness_snapshot: {
        asset_id: asset.asset.id,
        asset_name: asset.asset.name,
        status: asset.status,
        status_label: asset.statusLabel,
        minimum_crew: asset.minimumCrew,
        maximum_crew: asset.maximumCrew,
        missing_hard_stop_roles: asset.missingHardStopRoles,
        missing_required_roles: asset.missingRequiredRoles,
        preferred_gaps: asset.preferredGaps,
        likely_boat_crew: asset.likelyBoatCrew,
        likely_launch_recovery_crew: asset.likelyLaunchRecoveryCrew,
        likely_shore_support_crew: asset.likelyShoreSupportCrew,
        head_launcher: asset.headLauncher,
        role_conflicts: asset.roleConflicts,
      },
    })),
  );

  if (assetInsertError) {
    redirectWithFeedback(returnPath, assetInsertError.message, incidentRecord.station_id);
  }

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId: incidentRecord.station_id,
    actorProfileId: profile.id,
    action: "launch_initiated",
    entityId: incidentRecord.id,
    beforeData: { status: incidentRecord.status },
    afterData: {
      status: "active",
      initiated_at: new Date().toISOString(),
      launch_authority_profile_id: profile.id,
      selected_asset_ids: selectedAssetIds,
    },
    metadata: {
      cover_request_count: coverOverview.openCount,
      readiness_snapshot_timestamp: readinessSnapshot.captured_at,
    },
  });

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId: incidentRecord.station_id,
    actorProfileId: profile.id,
    action: "readiness_snapshot_captured",
    entityId: incidentRecord.id,
    afterData: readinessSnapshot as Record<string, unknown>,
  });

  const recipients = await loadIncidentCrewRecipients(supabase, incidentRecord.station_id);
  await Promise.all(
    recipients.map((recipient) =>
      writeNotification(supabase, {
        organisationId: profile.organisation_id,
        stationId: incidentRecord.station_id,
        relatedId: incidentRecord.id,
        type: "launch_initiated",
        title: "Launch initiated",
        body: `${incidentRecord.title} has been initiated for ${incidentRecord.operation_type.replace(/_/g, " ")}.`,
        recipientProfileId: recipient.id,
        actorProfileId: profile.id,
      }),
    ),
  );

  revalidatePath("/dla/launch");
  revalidatePath("/dla/incidents");
  revalidatePath("/dla");
  revalidatePath("/crew/incidents");
  revalidatePath("/");

  redirectWithFeedback(returnPath, "Launch initiated.", incidentRecord.station_id);
}

export async function updateIncidentResponseAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const returnPath = getReturnPath(formData, "/crew/incidents");
  const incidentId = getFormString(formData, "incident_id");
  const responseStatus = getFormString(formData, "response_status") as IncidentResponseStatus;
  const notes = getFormString(formData, "notes") || null;
  const etaMinutesRaw = getFormString(formData, "eta_minutes");
  const etaMinutes = etaMinutesRaw ? Number(etaMinutesRaw) : null;

  if (!incidentId || !responseStatus) {
    redirectWithFeedback(returnPath, "Incident and response status are required.");
  }

  if (!context.user || !context.profile || !context.isAuthenticated) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  const incident = await loadIncidentForAction(supabase, incidentId);
  if (!incident) {
    redirectWithFeedback(returnPath, "Incident could not be found.");
  }
  const incidentRecord = incident as NonNullable<typeof incident>;

  requireStationMembership(context, incidentRecord.station_id);

  if (incidentRecord.status !== "active") {
    redirectWithFeedback(returnPath, "Responses can only be recorded while the incident is active.", incidentRecord.station_id);
  }

  const { data: existingResponse } = await supabase
    .from("incident_responses")
    .select("id, response_status, notes, eta_minutes, responded_at")
    .eq("incident_id", incidentRecord.id)
    .eq("profile_id", profile.id)
    .maybeSingle();

  const { error } = await supabase.from("incident_responses").upsert(
    {
      incident_id: incidentRecord.id,
      profile_id: profile.id,
      response_status: responseStatus,
      eta_minutes: Number.isFinite(etaMinutes) ? etaMinutes : null,
      notes,
      responded_at: new Date().toISOString(),
    },
    {
      onConflict: "incident_id,profile_id",
    },
  );

  if (error) {
    redirectWithFeedback(returnPath, error.message, incidentRecord.station_id);
  }

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId: incidentRecord.station_id,
    actorProfileId: profile.id,
    action: existingResponse ? "incident_response_changed" : "incident_response_submitted",
    entityId: incidentRecord.id,
    beforeData: existingResponse ?? {},
    afterData: {
      response_status: responseStatus,
      eta_minutes: Number.isFinite(etaMinutes) ? etaMinutes : null,
      notes,
    },
    metadata: {
      responder_profile_id: profile.id,
    },
  });

  const recipients = await loadIncidentCrewRecipients(supabase, incidentRecord.station_id);
  await Promise.all(
    recipients.map((recipient) =>
      writeNotification(supabase, {
        organisationId: profile.organisation_id,
        stationId: incidentRecord.station_id,
        relatedId: incidentRecord.id,
        type: "crew_response_received",
        title: "Crew response received",
        body: `${profile.display_name ?? profile.email ?? profile.id} responded ${responseStatus.replace(/_/g, " ")} to ${incidentRecord.title}.`,
        recipientProfileId: recipient.id,
        actorProfileId: profile.id,
      }),
    ),
  );

  revalidatePath("/crew/incidents");
  revalidatePath("/dla/incidents");
  revalidatePath("/dla/launch");
  revalidatePath("/dla");
  revalidatePath("/");

  redirectWithFeedback(returnPath, "Response recorded.", incidentRecord.station_id);
}

export async function updateIncidentStatusAction(formData: FormData) {
  const context = await getCurrentUserContext();
  const supabase = await createSupabaseServerClient();
  const returnPath = getReturnPath(formData, "/dla/incidents");
  const incidentId = getFormString(formData, "incident_id");
  const status = getFormString(formData, "status") as "standing_down" | "closed" | "cancelled";
  const notes = getFormString(formData, "notes") || null;

  if (!incidentId || !status) {
    redirectWithFeedback(returnPath, "Incident and status are required.");
  }

  if (!context.user || !context.profile || !context.isAuthenticated) {
    redirectWithFeedback(returnPath, "Sign in required.");
  }
  const profile = context.profile as NonNullable<typeof context.profile>;

  const incident = await loadIncidentForAction(supabase, incidentId);
  if (!incident) {
    redirectWithFeedback(returnPath, "Incident could not be found.");
  }
  const incidentRecord = incident as NonNullable<typeof incident>;

  requireStationMembership(context, incidentRecord.station_id);

  if (!context.canAccessDla && !context.isSuperAdmin) {
    redirectWithFeedback(returnPath, "DLA or admin access is required to change incident state.", incidentRecord.station_id);
  }

  const timestamp = new Date().toISOString();
  const nextState =
    status === "standing_down"
      ? {
          status: "stood_down" as const,
          stood_down_at: timestamp,
        }
      : status === "closed"
        ? {
            status: "closed" as const,
            closed_at: timestamp,
          }
        : status === "cancelled"
          ? {
              status: "cancelled" as const,
              cancelled_at: timestamp,
            }
          : {
              status: incidentRecord.status,
            };

  const { error } = await supabase
    .from("incidents")
    .update({
      ...nextState,
      dynamic_risk_assessment_notes: notes ?? incidentRecord.dynamic_risk_assessment_notes,
      is_active: nextState.status === "active",
    })
    .eq("id", incidentRecord.id);

  if (error) {
    redirectWithFeedback(returnPath, error.message, incidentRecord.station_id);
  }

  await writeAuditLog(supabase, {
    organisationId: profile.organisation_id,
    stationId: incidentRecord.station_id,
    actorProfileId: profile.id,
    action:
      status === "standing_down"
        ? "incident_stood_down"
        : status === "closed"
          ? "incident_closed"
          : "incident_cancelled",
    entityId: incidentRecord.id,
    beforeData: { status: incidentRecord.status },
    afterData: {
      status: nextState.status,
      notes,
    },
  });

  const recipients = await loadIncidentCrewRecipients(supabase, incidentRecord.station_id);
  await Promise.all(
    recipients.map((recipient) =>
      writeNotification(supabase, {
        organisationId: profile.organisation_id,
        stationId: incidentRecord.station_id,
        relatedId: incidentRecord.id,
        type:
          status === "standing_down"
            ? "incident_stood_down"
            : status === "closed"
              ? "incident_closed"
              : "incident_cancelled",
        title:
          status === "standing_down"
            ? "Incident stood down"
            : status === "closed"
              ? "Incident closed"
              : "Incident cancelled",
        body: `${incidentRecord.title} was updated to ${nextState.status.replace(/_/g, " ")}.`,
        recipientProfileId: recipient.id,
        actorProfileId: profile.id,
      }),
    ),
  );

  revalidatePath("/dla/incidents");
  revalidatePath("/dla/launch");
  revalidatePath("/dla");
  revalidatePath("/crew/incidents");
  revalidatePath("/");

  redirectWithFeedback(returnPath, "Incident updated.", incidentRecord.station_id);
}
