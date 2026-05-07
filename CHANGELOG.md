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

## 0.2.2 - 2026-05-07

- Fixed `supabase/seed.sql` so the Southend assets are inserted idempotently.
- Added deterministic asset codes for inshore and offshore assets to avoid conflicts across locations.
- Preserved duplicate asset names across different station locations.

## 0.2.3 - 2026-05-07

- Manually validated the Phase 2 Supabase schema, seed, and RLS setup in project `yhddbkkjpyeetihrlxrw`.
- Confirmed all nine Southend assets are present and the schema is safe to merge into `develop`.
- Marked the Phase 2 guard-rail documents as complete and ready for the next phase.

## 0.3.0 - 2026-05-07

- Added the Phase 3 auth/session foundation on `feature/auth-session-foundation`.
- Added Supabase Auth login/logout flows, middleware route protection, and current user/profile loading.
- Added role-aware navigation labels and unauthorized handling.
- Added server-side session handling for protected routes.

## 0.3.1 - 2026-05-07

- Hardened the Phase 3 auth/session checks so inactive profiles cannot access protected routes.
- Removed the unauthorized-page redirect loop so blocked users can reach the access-denied screen.
- Restored the `.env.example` template and documented that `.env.local` must remain uncommitted.
- Recorded browser smoke-test coverage for `/login`, `/`, `/crew`, `/dla`, `/admin`, `/unauthorized`, and logout.

## 0.3.2 - 2026-05-07

- Added a deferred backlog note for RNLI public station reference/import.
- Clarified that RNLI public station data is reference-only for future admin pre-population and must not overwrite operational data automatically.
- Noted that any future RNLI import work must review site terms first and capture source URL and last checked date.

## 0.3.3 - 2026-05-07

- Published the completed branches to GitHub.
- Opened draft pull requests for the schema/RLS and auth/session branches.
- Noted that `feature/initial-foundation` is already the same commit as `develop`, so GitHub does not create a PR for that branch.
