# Changelog

## 0.1.0 - 2026-05-07

- Created the initial Launch Ready foundation.
- Added dashboard, crew, DLA, and admin placeholder routes.
- Added responsive sidebar navigation and mobile drawer.
- Added Supabase client scaffolding and environment templates.
- Added initial governance, security, schema, deployment, and smoke-test documents.

## 0.2.0 - 2026-05-07

- Added the Phase 2 Supabase schema and RLS foundation.
- Added org, station, location, asset, crew, availability, incident, notification, audit, and settings tables.
- Added initial station-scoped RLS policies and auth user profile provisioning.
- Added safe Southend demo seed data for development.
- Added admin placeholder pages for stations, locations, assets, crew, roles, minimum crewing, qualifications, availability, and duty rota.

## 0.2.1 - 2026-05-07

- Fixed the Phase 2 migration ordering so tables are created before helper functions that reference them.
- Reordered `profiles`-dependent and membership-dependent SQL helpers below the table block.
- Confirmed the corrected file order places `profiles` before `is_super_admin` and the remaining access helpers.
