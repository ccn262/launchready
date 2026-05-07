# Database Schema

## Core Entities

- `organisations`
- `stations`
- `locations`
- `assets`
- `crew_profiles`
- `crew_qualifications`
- `crew_availability_blocks`
- `station_rotas`
- `launch_alerts`
- `alert_deliveries`
- `audit_log_entries`

## Initial Relationships

- One organisation has many stations.
- One station has many locations.
- One location has many assets.
- One crew profile belongs to one organisation and may be linked to one or more station scopes.
- One crew profile has many qualifications and many availability blocks.
- One station has many rota entries and many launch alerts.
- One launch alert may produce many delivery attempts.
- One audit log entry belongs to one actor and one target entity.

## Qualification Model

- Qualifications are per asset, not global.
- Qualification state must support green, amber, and red currency.
- Qualifications can carry expiry dates and operational notes.

## Availability Model

- Availability blocks store start time, end time, cover type, location scope, and the asset or role they support.
- Night cover, full-day cover, and split-day cover must all be representable.
- Monday to Thursday rota logic must be representable.

## Next Migration Set

1. Organisations and stations.
2. Locations and assets.
3. Crew profiles and availability.
4. Qualifications and rota tables.
5. Alerts, deliveries, and audit logging.
6. RLS policies on every table.
