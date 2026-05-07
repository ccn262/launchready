# Fix Log

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
