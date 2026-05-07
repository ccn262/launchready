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
- Night cover, full-day cover, and split-day cover must all be representable.
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
