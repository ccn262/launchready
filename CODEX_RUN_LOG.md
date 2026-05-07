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

## 2026-05-07 12:05 BST

- Branch: `feature/auth-session-foundation`
- Files changed: auth helper and middleware hardening plus security, smoke-test, environment, handoff, changelog, and fix-log updates.
- Errors: inactive profiles could still gain access through active memberships, and the unauthorized redirect path could bounce blocked users back to `/`.
- Fixes attempted: gated access on `profiles.is_active`, excluded inactive profiles from route checks, removed the redirect-away behavior from `/unauthorized`, and restored the missing `.env.example` template.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Browser smoke notes: documented `/login`, `/`, `/crew`, `/dla`, `/admin`, `/unauthorized`, and logout checks.
- Next recommended step: verify the browser route matrix against the authenticated test account, then merge Phase 3 into `develop` if the manual smoke pass is clean.

## 2026-05-07 12:40 BST

- Branch: `feature/auth-session-foundation`
- Files changed: build plan, decisions log, project handoff, code run log, and changelog.
- Purpose: record RNLI public station pages as a future reference-only backlog item for admin pre-population, with manual confirmation required and no automated import.
- Errors: none.
- Tests run: none.
- Next recommended step: keep RNLI import work deferred until CRUD and readiness engine work is stable, then review site terms before any automation.

## 2026-05-07 12:43 BST

- Branch: `feature/auth-session-foundation`
- Files changed: code run log, project handoff, build plan, changelog.
- Branches pushed: `develop`, `feature/initial-foundation`, `feature/supabase-schema-rls-foundation`, `feature/auth-session-foundation`.
- Pull requests created: `https://github.com/ccn262/launchready/pull/1` and `https://github.com/ccn262/launchready/pull/2`.
- PR note: `feature/initial-foundation` could not be opened against `develop` because `develop` was bootstrapped from the same commit, so GitHub reported no commits between the refs.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: merge the published branches in dependency order, with `feature/supabase-schema-rls-foundation` before `feature/auth-session-foundation`.

## 2026-05-07 13:03 BST

- Branch: `fix/vercel-edge-middleware-auth`
- Files changed: `middleware.ts`, protected page route guards, `src/lib/auth.ts`, and the project guard-rail docs.
- Error: Vercel Edge middleware rejected imports of `@/lib/auth` and `@/lib/supabase/middleware` because they pull server-side code into the Edge bundle.
- Fixes attempted: inlined the minimal Supabase session refresh logic in middleware, removed all server-only imports from the Edge file, and moved detailed role checks into server-rendered route helpers.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: commit, push, and open a PR from `fix/vercel-edge-middleware-auth` into `develop`.
