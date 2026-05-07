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

## 0.3.4 - 2026-05-07

- Fixed the Vercel Edge middleware compatibility issue by removing imports of server-only auth helpers from middleware.
- Moved detailed route authorization into server-rendered route helpers for the protected pages.
- Kept middleware focused on session refresh and login redirects only.

## 0.4.0 - 2026-05-07

- Added the first real admin CRUD surfaces for stations, locations, asset types, and assets.
- Added station-scoped station, location, and asset management with super-admin-only asset type editing.
- Added optional operational notes fields for station locations and assets via a corrective schema migration.
- Updated the admin landing page, smoke tests, and security documentation to reflect the new CRUD routes.

## 0.5.0 - 2026-05-07

- Added station crew management for memberships, crew type, membership role, and active status.
- Added asset-specific role assignment with currency states per crew member and per asset.
- Added qualification management with expiry-aware casualty care tracking.
- Reused the existing `station_memberships` and `crew_qualifications` tables for the Phase 5 admin surfaces.

## 0.5.1 - 2026-05-07

- Added backlog notes for weekend duty rota management after the availability engine exists.
- Added backlog notes for reusable crew capability badge rendering across dashboards, rotas, and communication summaries.
- Added backlog notes for like-for-like cover and swap requests with audit logging and eligibility validation.

## 0.5.2 - 2026-05-07

- Added future readiness-engine backlog notes for safe-crewing rules by asset type and operation type.
- Added future readiness-engine backlog notes for minimum role complements, launch/recovery separation, and effective-dated rule sets.
- Clarified that safe-crewing reference material is restricted internal guidance and not public-facing RNLI approval.


## 0.6.0 - 2026-05-07

- Added the Phase 6 availability and rota foundation routes for crew and station admins.
- Added reusable crew capability badge rendering for asset-specific roles and currency states.
- Added weekend-unavailable availability support and weekend duty rota foundation fields.
- Kept auto-rota generation, cover/swap requests, and the full readiness engine in backlog.

## 0.7.0 - 2026-05-07

- Added the first readiness engine foundation with effective-dated safe-crewing rules.
- Added a reusable readiness board for the dashboard, DLA, and admin readiness console.
- Added readiness calculations for station, location, and asset status using crew availability, duty periods, qualifications, and asset-specific roles.
- Seeded conservative safe-crewing baseline rules and launch/recovery requirements for the Southend reference station.

## 0.7.1 - 2026-05-07

- Fixed the Phase 7 seed SQL syntax error in the launch/recovery requirements block.
- Kept the Phase 7 seed idempotent while preserving duplicate asset names across locations.

## 0.7.2 - 2026-05-07

- Added advisory readiness allocation output for likely boat crew, likely launch/recovery crew, role conflicts, crew who could restore readiness, and Head Launcher status on the readiness board.
