# Database Schema

## Core Entities

- `organisations`
- `stations`
- `station_locations`
- `asset_types`
- `assets`
- `profiles`
- `station_memberships`
- `crew_types`
- `operational_roles`
- `asset_role_qualifications`
- `asset_minimum_crewing`
- `qualification_types`
- `crew_qualifications`
- `availability_slots`
- `duty_periods`
- `incidents`
- `incident_assets`
- `incident_responses`
- `notifications`
- `notification_delivery_attempts`
- `audit_log`
- `system_settings`

## Phase 4 Notes Fields

- `station_locations.notes` stores optional operational notes for station locations.
- `assets.notes` stores optional operational notes for assets.

## Future Readiness-Engine Reference Data

- Future safe-crewing rules should be effective-date aware and scoped by `asset_type_id` and `operation_type`.
- Future required-role rules should track `asset_type_id`, `operation_type`, `operational_role_id`, requirement level, and effective date ranges.
- Future launch/recovery rules should be modelled separately from boat-crew capability so launch methods can be evaluated without conflating the two.
- Future exception handling should record reason, approving authority or role, notes, and service-return status.

## Phase 7 Readiness Tables

- `safe_crewing_rules` stores effective-dated minimum and maximum crew baselines by asset type and operation type.
- `safe_crewing_role_requirements` stores effective-dated required-role complements by asset type, operation type, and requirement level.
- `asset_launch_recovery_requirements` stores launch/recovery role requirements per asset.
- The readiness engine combines these tables with availability slots, duty periods, crew qualifications, station memberships, assets, and locations.

## Phase 8 Cover Request Tables

- `cover_requests` stores cover requests by station, asset, role, duty period, period type, urgency, and status.
- `cover_request_responses` stores crew offers, acceptances, withdrawals, rejection states, and eligibility notes for each cover request.
- `cover_request_cover_type` captures `weekend`, `day`, `night`, and `custom` cover periods.
- `cover_request_status` captures `open`, `accepted`, `cancelled`, and `expired` states.
- `cover_request_urgency` captures `normal` and `urgent` requests.
- `cover_request_response_status` captures `offered`, `accepted`, `withdrawn`, and `rejected` responses.
- `cover_request_eligibility_status` captures `eligible`, `ineligible`, and `needs_admin_review`.
- Notification rows for cover-request placeholders are written without sending real messages.

## Phase 9 Incident and Launch Tables

- `incidents` now stores launch drafts, initiated incidents, standing-down states, closed states, and cancelled states using the existing incident table plus additional launch metadata columns.
- `incidents.operation_type` records `service`, `exercise`, `passage`, `boat_movement`, or `assurance_activity` for launch-draft and incident tracking.
- `incidents.station_location_id` records the selected station location for the launch draft or incident.
- `incidents.launch_authority_profile_id` records the initiating DLA/admin/LOM user for audit and response context.
- `incidents.incident_type`, `dynamic_risk_assessment_notes`, `readiness_snapshot`, `selected_asset_ids`, `drafted_at`, `initiated_at`, and `cancelled_at` support the launch workflow without turning the model into an authorising system.
- `incident_assets.readiness_status_at_initiation` and `incident_assets.readiness_snapshot` store the readiness state captured when the incident is initiated.
- `incident_responses` remains crew-facing and is constrained by a unique `(incident_id, profile_id)` response boundary so one crew member can update their own response for an active incident.
- The application maps `incidents.status = open` to draft and `incidents.status = active` to initiated for UI purposes, while `stood_down`, `closed`, and `cancelled` remain explicit operational states.

## Initial Relationships

- One organisation has many stations.
- One station has many locations.
- One location has many assets.
- One location may also carry optional notes for operational context.
- One asset may also carry optional notes for operational context.
- One profile belongs to one organisation and may hold many station memberships.
- One crew profile has many qualifications and many availability blocks.
- One station has many rota entries and many incidents.
- One incident may produce many asset links, responses, and notifications.
- One notification may produce many delivery attempts.
- One audit log entry belongs to one actor and one target entity.

## Qualification Model

- Qualifications are per asset, not global.
- Qualification state must support green, amber, and red currency.
- Qualifications can carry expiry dates and operational notes.
- Casualty care is tracked as a qualification type with its own expiry support.

## Availability Model

- Availability blocks store start time, end time, cover type, location scope, and the asset or role they support.
- Availability rows now also support `starts_at`, `ends_at`, and `created_by_profile_id` so the UI can work with full datetime windows directly.
- `availability_slots.slot_kind` includes `full_day`, `partial_day`, `night_cover`, `unavailable`, and `weekend_unavailable`.
- `duty_periods.period_kind` includes `day_cover`, `night_cover`, `launch_alert`, `incident_cover`, `training`, `weekend_cover`, `dla_day`, and `dla_night`.
- Night cover, full-day cover, split-day cover, and weekend unavailability must all be representable.
- Monday to Thursday rota logic must be representable.
- Weekend rota and readiness-engine coverage should be added later as separate future phases rather than merged into Phase 2 or Phase 5.

## Next Migration Set

1. Organisations and stations.
2. Locations and assets.
3. Crew profiles and availability.
4. Qualifications and rota tables.
5. Alerts, deliveries, and audit logging.
6. RLS policies on every table.
7. Station and asset CRUD notes fields where needed.
8. Availability and rota foundation datetime columns plus extended slot and period kinds.
9. Readiness engine outputs are computed server-side and now include advisory allocation fields for likely boat crew, likely launch/recovery crew, role conflicts, readiness-restoration candidates, and Head Launcher status. No new database columns were added for those computed outputs.
