# Codex Run Log

## 2026-05-07 11:11 BST

- Branch: `feature/supabase-schema-rls-foundation`
- Files changed: `supabase/seed.sql` plus supporting run/fix logs.
- Errors: the seed had no asset insert block, so `assets` remained empty after manual execution in Supabase SQL Editor.
- Fixes attempted: added deterministic asset upserts keyed by `station_id + asset_code` and ordered inserts after station/location/type seed rows.
- Tests run: `npm run lint`, `npm run build`.
- Manual Supabase validation: completed successfully in project `yhddbkkjpyeetihrlxrw`.
- Verified data: Launch Ready Demo organisation, Southend Lifeboat Station, both station locations, expected asset types, and all nine Southend assets now exist.
- Phase 2 status: safe to merge into `develop`.
- Verification SQL to rerun in Supabase SQL Editor:
  ```sql
  select name from organisations;
  select name from stations;
  select name from station_locations order by name;
  select name from asset_types order by name;
  select a.name, sl.name as location_name, at.name as asset_type_name
  from assets a
  join station_locations sl on sl.id = a.station_location_id
  join asset_types at on at.id = a.asset_type_id
  order by sl.name, a.name;
  ```
- Next recommended step: merge Phase 2 into `develop`, then start Phase 3 auth/session foundation.

## 2026-05-07 11:40 BST

- Branch: `feature/auth-session-foundation`
- Files changed: auth/session helpers, middleware, login and unauthorized pages, server actions, shell refactor, env example, and security/setup docs.
- Errors: none after lint and build reruns.
- Fixes attempted: split the shell into server/client layers, added middleware-based route protection, and normalised Supabase response typing in the auth helper layer.
- Tests run: `npm run lint`, `npm run build`.
- Protected routes: `/`, `/crew`, `/dla`, `/admin`.
- Next recommended step: perform the manual Supabase Auth setup steps, then verify sign-in, sign-out, and route redirects in the browser.
