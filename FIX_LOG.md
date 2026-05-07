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
