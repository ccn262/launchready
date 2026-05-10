# Fix Log

## 2026-05-07 Phase 8 Cover Visibility

- Fixed cover-request visibility for rows with nullable `asset_id` and `operational_role_id` by using left-joined related records in the loader.
- Added a fallback label of `General station cover` so general cover requests render clearly when no asset, role, or crew type is attached.
- Added a recent/past requests section so accepted, cancelled, and expired cover requests remain visible instead of disappearing from the UI.

## 2026-05-07 Phase 8 Cover Request Foundation

- Added the Phase 8 `cover_requests` and `cover_request_responses` schema, RLS, notification placeholders, eligibility helper, and cover management pages.
- Fixed strict TypeScript errors in `src/app/cover-actions.ts` by aligning query shapes with the existing membership record types and narrowing nullable query results before use.
- Fixed the cover overview loader so `ownRequests` returns summary items instead of raw request rows.
- Added the admin cover page `ownMembership` field back into the returned data shape so the admin view compiles cleanly.

## 2026-05-07

- Replaced the default Next.js starter page with a Launch Ready operational dashboard shell.
- Added lazy Supabase client factories to avoid build-time client initialization.
- Fixed the generated font/theme setup to use literal font names in Tailwind theme tokens.
- Removed the drawer-close `useEffect` from the shell and closed mobile navigation directly from link clicks to satisfy lint rules.

## 2026-05-07 Phase 2

- Added the first Supabase schema and RLS migration file plus safe development seed data.
- Added admin placeholder routes for the schema areas introduced in Phase 2.
- Fixed an unused import in the admin overview after the first lint pass.
- Attempted local Supabase validation, but Docker Desktop is not available in this environment.

## 2026-05-07 Ordering Fix

- Reordered the Phase 2 migration so table-dependent helper functions are defined only after the referenced tables exist.
- Moved `is_super_admin`, `is_station_member`, `has_station_role`, `can_manage_station`, `can_manage_organisation`, and `can_dla_station` below the table block.
- Verified the migration file now defines `profiles` before any function that queries it.

## 2026-05-07 Seed Fix

- Added the missing asset seed block to `supabase/seed.sql`.
- Switched asset inserts to deterministic `asset_code` values so the seed is idempotent across repeated runs.
- Kept duplicate asset names valid across different station locations by using `station_id + asset_code` as the conflict target.

## 2026-05-07 Validation Complete

- Confirmed the Phase 2 seed and schema work manually in Supabase project `yhddbkkjpyeetihrlxrw`.
- Verified the full Southend asset set now exists in `assets`.
- Marked Phase 2 as safe to merge into `develop`.

## 2026-05-07 Auth Foundation

- Added middleware-based protection for `/`, `/crew`, `/dla`, and `/admin`.
- Added login and unauthorized pages plus server-side sign-in/sign-out actions.
- Refactored the sidebar shell so it can render role-aware navigation from the current Supabase profile and memberships.

## 2026-05-07 Auth Hardening

- Blocked inactive profiles from satisfying route access checks.
- Kept inactive memberships out of the access decision set.
- Removed the redirect-away behavior from `/unauthorized` so blocked sessions can reach the access-denied page.
- Restored the missing `.env.example` template after the working tree delete.

## 2026-05-07 Vercel Edge Fix

- Removed `@/lib/auth` and `@/lib/supabase/middleware` imports from `middleware.ts` so the Edge bundle only uses edge-safe code.
- Inlined the minimal Supabase session refresh logic in middleware.
- Moved detailed role checks into server-rendered page guards for `/`, `/crew`, `/dla`, and `/admin`.

## 2026-05-07 Phase 4 CRUD Foundation

- Added the first real admin CRUD pages for stations, locations, asset types, and assets.
- Added a corrective migration for `station_locations.notes` and `assets.notes` so operational notes can be captured without changing the core schema again.
- Added cancel/reset handling to the new admin forms for a clearer mobile-first workflow.

## 2026-05-07 Phase 5 Crew and Roles Foundation

- Added crew management for station memberships and active status.
- Added asset-specific operational role assignment using `crew_qualifications`.
- Added qualification management with casualty care expiry handling.
- Fixed a primary-membership edge case so the new membership flow does not accidentally clear the newly created primary record.

## 2026-05-07 Vercel Middleware Runtime Fix

- Reworked `middleware.ts` to be fully Edge-safe and fail closed when Supabase config or session refresh fails.
- Added defensive redirects for missing config and session refresh errors instead of letting the Edge runtime throw a 500.
- Tightened the middleware matcher so static assets and public files are excluded from invocation.


## 2026-05-07 Phase 6 Availability and Rota Foundation

- Added the crew and admin availability/rota foundation routes.
- Fixed the crew availability write guard so crew users can save their own availability without requiring admin-only station permissions.
- Fixed loader tuple typing in the Phase 6 helper so array-returning helpers are destructured correctly.
- Fixed build-time nullability issues in the Phase 6 actions by narrowing profile and datetime values before payload assembly.
- Confirmed `npm run lint` and `npm run build` pass after the Phase 6 fixes.

## 2026-05-07 Phase 7 Readiness Engine

- Fixed `src/lib/readiness.ts` to import shared asset and asset type records from the modules that actually export them.
- Added the missing `rule` field to every readiness asset summary branch so the summary type stays stable.
- Changed safe-crewing rule selection so `boat_movement` and `assurance_activity` can fall back to service baselines when no exact row exists.
- Corrected the safe-crewing seed join order for launch/recovery requirements so the SQL remains valid and idempotent.

## 2026-05-07 Phase 7 Seed Syntax Fix

- Fixed the launch/recovery seed block in `supabase/seed.sql` by converting the inline `VALUES` list to a `CROSS JOIN`.
- Kept the `WHERE` filters before `ON CONFLICT` so the statement remains valid and idempotent in Supabase SQL Editor.

## 2026-05-07 Phase 7 Advisory Allocation Fix

- Fixed the readiness allocation helper so advisory crew allocation compiles cleanly and can surface likely boat crew, likely launch/recovery crew, role conflicts, and Head Launcher status.
- Removed the stale legacy matcher after the advisory allocation path replaced it.

## 2026-05-07 Advisory Crew-State Split Fix

- Updated the readiness summary to surface qualified crew, available crew, and suggested allocation separately on each asset card.
- Preserved advisory-only behavior and Head Launcher conflict handling.

## 2026-05-07 Readiness Key Fix

- Fixed duplicate React keys in the readiness board by using a stable composite key for requirement rows.
- Added defensive deduplication for readiness gap arrays in the loader so repeated rows do not render twice.

## 2026-05-07 Middleware Runtime Failure Fix

- Branch: `fix/vercel-middleware-runtime-failure`
- Root cause: Edge middleware was still attempting Supabase session handling on Vercel, which could fail before the app-level route helpers had a chance to recover.
- Fix: removed Supabase client creation from middleware, wrapped the entire middleware body in a single try/catch, and switched to a lightweight cookie-presence gate for protected routes.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed.
- Next recommended step: verify the Vercel `develop` deployment no longer shows `MIDDLEWARE_INVOCATION_FAILED`.

## 2026-05-07 Middleware Runtime Failure Validation

- Confirmed the Edge middleware now fails closed via a top-level try/catch and no longer creates a Supabase client in middleware.
- Protected routes redirect to `/login?error=middleware_fallback` on unexpected middleware failure, while public routes remain accessible.

## 2026-05-07 Middleware Redirect-Loop Fix

- Branch: `fix/vercel-middleware-runtime-failure`
- Root cause: middleware was still redirecting `/login` to `/` based on cookie presence alone, which could loop when stale cookies were present.
- Fix: let `/login` remain public in middleware and keep authenticated-user redirect logic in `src/app/login/page.tsx`, where real server-side session validation already exists.
- Tests run: not yet run in this patch set.
- Next recommended step: run `npm run lint` and `npm run build`, then update the PR.

## 2026-05-07 Cover Request Visibility Cache Fix

- Branch: `feature/cover-swap-requests`
- Root cause: cover-request pages could serve a stale empty snapshot, so current and future open requests already present in Supabase were not reliably reflected in the UI.
- Fix: marked the cover-request data path as dynamic, added `unstable_noStore()` to the loader, and kept development-only debug output for selected station/profile/count visibility.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed after the cache-bypass change.
- Next recommended step: browser retest `/crew/cover`, `/admin/cover`, `/`, and `/dla`.

## 2026-05-07 Phase 9 Launch Initiation Foundation

- Branch: `feature/dla-launch-initiation`
- Scope: added DLA launch initiation drafts, readiness previews, launch snapshots, incident response tracking, and placeholder notifications.
- Fixes: narrowed incident action payload types, aligned draft/initiation status handling, and kept launch initiation advisory only.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed after the Phase 9 implementation.
- Next recommended step: browser smoke-test `/dla/launch`, `/dla/incidents`, `/crew/incidents`, and the incident summary on `/`.

## 2026-05-10 Demo Seed Dataset

- Branch: `feature/dla-launch-initiation`
- Scope: added `supabase/demo-seed.sql` with Southend-only fake profiles, memberships, qualifications, availability, duty periods, cover requests, notification placeholders, and audit rows for browser testing.
- Fixes: rewrote the seed into deterministic idempotent inserts and added the missing Southend role/currency coverage needed for Phase 9 browser testing.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed.
- Next recommended step: run the demo seed in Supabase SQL Editor and verify the Southend demo rows.

## 2026-05-10 Demo Seed UUID Cast Fix

- Branch: `feature/dla-launch-initiation`
- Scope: fixed `supabase/demo-seed.sql` so CTE-backed inserts cast `row_id` values to `uuid` before inserting into UUID primary-key columns.
- Fixes: applied explicit `::uuid` casts for membership, qualification, availability, duty-period, and cover-request inserts.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed after the cast fix.
- Next recommended step: rerun `supabase/demo-seed.sql` in Supabase SQL Editor and verify the Southend demo rows.

## 2026-05-10 Demo Seed UUID Source Cast Expansion

- Branch: `feature/dla-launch-initiation`
- Scope: expanded the demo seed so every UUID source column in the CTE-backed inserts is explicitly cast before insertion.
- Fixes: cast `profile_id`, `station_id`, `station_location_id`, `asset_id`, `asset_type_id`, `crew_type_id`, `operational_role_id`, `qualification_type_id`, `requester_profile_id`, `original_duty_period_id`, `accepted_by_profile_id`, and the fixed UUID literals used by the placeholder rows in notifications and audit logging.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed after the wider cast fix.
- Next recommended step: rerun the demo seed in Supabase SQL Editor and confirm the Southend demo rows load cleanly.
