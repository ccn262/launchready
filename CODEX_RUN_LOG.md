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

## 2026-05-07 13:26 BST

- Branch: `feature/admin-station-location-asset-crud`
- Files changed: `src/app/admin/stations/page.tsx`, `src/app/admin/locations/page.tsx`, `src/app/admin/asset-types/page.tsx`, `src/app/admin/assets/page.tsx`, `src/app/admin/page.tsx`, `src/app/admin/loading.tsx`, `src/app/admin/actions.ts`, `src/lib/admin-crud.ts`, `src/app/admin/assets/page.tsx`, `supabase/migrations/20260508000000_phase4_admin_notes.sql`, and supporting project logs/docs.
- Error: TypeScript relation normalisation failed during `next build` because station/location/asset relation shapes were being normalised through the wrong helper type.
- Fixes attempted: replaced the constrained relation helper with a generic `getFirstRecord()` helper, then re-ran lint and build successfully.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: commit the Phase 4 CRUD branch, push it, and open a PR into `develop` for review and manual browser smoke testing.

## 2026-05-07 14:05 BST

- Branch: `feature/crew-management-asset-roles`
- Files changed: `src/app/admin/crew/page.tsx`, `src/app/admin/roles/page.tsx`, `src/app/admin/qualifications/page.tsx`, `src/app/admin/phase5-actions.ts`, `src/lib/admin-phase5.ts`, and supporting project logs/docs.
- Errors: initial TypeScript validation failed because the qualification relation helper carried fields that the query did not actually return, and the primary-membership flow could clear the newly created primary record.
- Fixes attempted: trimmed the qualification record shape to the actual query result, rewired the primary-membership update logic to clear old primaries before insert/update, and reran the checks.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: do a browser smoke test for crew membership edits, asset-specific role assignment, and qualification expiry handling, then merge once the review pass is clean.

## 2026-05-07 14:20 BST

- Branch: `feature/crew-management-asset-roles`
- Files changed: `BUILD_PLAN.md`, `DECISIONS_LOG.md`, `PROJECT_HANDOFF.md`, and `CHANGELOG.md`.
- Purpose: record future roadmap items for weekend duty rota management, reusable crew capability badges, and like-for-like cover/swap requests.
- Errors: none.
- Tests run: none, documentation-only update.
- Next recommended step: leave these items in backlog until the availability engine and rota foundation are in place.

## 2026-05-07 14:33 BST

- Branch: `feature/crew-management-asset-roles`
- Files changed: `BUILD_PLAN.md`, `DATABASE_SCHEMA.md`, `SECURITY_MODEL.md`, `PROJECT_HANDOFF.md`, `CHANGELOG.md`, and supporting run log references.
- Purpose: record restricted internal readiness-engine guidance for safe crewing, minimum role complements, launch/recovery separation, and dynamic risk assessment boundaries.
- Errors: none.
- Tests run: none, documentation-only update.
- Next recommended step: defer readiness-engine implementation until availability, rota, and crew capability foundations are stable.

## 2026-05-07 14:04 BST

- Branch: `feature/crew-management-asset-roles`
- Files changed: `middleware.ts`, `FIX_LOG.md`, `CODEX_RUN_LOG.md`, `PROJECT_HANDOFF.md`, `SECURITY_MODEL.md`, and `SMOKE_TEST.md`.
- Error: Vercel preview was failing in Edge middleware at runtime with `MIDDLEWARE_INVOCATION_FAILED`.
- Fixes attempted: made middleware self-contained, added defensive config checks and try/catch around Supabase session refresh, and tightened the matcher to skip static assets and public files.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: let Vercel redeploy the preview, then continue Phase 5 browser smoke testing if the preview is green.


## 2026-05-07 14:39 BST

- Branch: `feature/availability-night-weekend-rota`
- Files changed: Phase 6 availability/rota routes, shared capability badge helpers, Phase 6 server actions, Phase 6 loaders, migration, and supporting project docs.
- Errors: crew availability initially used the admin-only station guard; Phase 6 helpers also had tuple typing and nullability issues during `next build`.
- Fixes attempted: added a crew-scoped station access guard for availability writes, tightened helper return types, normalized loader destructuring, and narrowed action payload values before insertion/update.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: run the browser smoke test for `/crew/availability`, `/crew/rota`, `/admin/availability`, and `/admin/duty-rota`, then merge Phase 6 if the review pass is clean.

## 2026-05-07 15:08 BST

- Branch: `feature/readiness-engine`
- Files changed: readiness engine helper, readiness board component, dashboard and DLA readiness views, admin readiness page, admin availability and duty rota handoff links, safe-crewing seed data, build plan, project handoff, database schema, security model, smoke test, changelog, fix log, decisions log, and this run log.
- Errors: initial TypeScript validation failed because `AssetRecord` and `AssetTypeRecord` were imported from the wrong helper module, and the asset summary type was missing its `rule` field in early-return branches.
- Fixes attempted: moved shared record types to `src/lib/admin-crud.ts`, added `rule` to every readiness asset return path, broadened the safe-crewing rule picker to fall back to service baselines, and corrected the safe-crewing seed join order for launch/recovery inserts.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: run the browser smoke test for `/`, `/dla`, and `/admin/readiness`, then decide whether to merge the readiness branch into `develop`.

## 2026-05-07 15:20 BST

- Branch: `feature/readiness-engine`
- Files changed: `supabase/seed.sql`, `FIX_LOG.md`, `CODEX_RUN_LOG.md`, `CHANGELOG.md`, and `PROJECT_HANDOFF.md`.
- Error: Phase 7 seed SQL failed in Supabase SQL Editor because the launch/recovery seed block used `JOIN (...)` without a valid join condition before the `WHERE` clause.
- Fixes attempted: converted the inline `VALUES` table to a `CROSS JOIN`, kept the `WHERE` filters before `ON CONFLICT`, and preserved idempotent upserts.
- Verification SQL to run in Supabase:
  select asset_type_id, operation_type, minimum_crew, maximum_crew, darkness_minimum_crew, effective_from from safe_crewing_rules order by asset_type_id, operation_type, effective_from;
  select asset_type_id, operation_type, operational_role_id, required_count, requirement_level, effective_from from safe_crewing_role_requirements order by asset_type_id, operation_type, effective_from;
  select asset_id, operational_role_id, required_count, requirement_level from asset_launch_recovery_requirements order by asset_id, operational_role_id;
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: rerun `supabase/seed.sql` in Supabase SQL Editor, then continue Phase 7 browser smoke testing.

## 2026-05-07 15:46 BST

- Branch: `feature/readiness-engine`
- Files changed: `src/lib/readiness.ts`, `src/components/readiness-board.tsx`, `BUILD_PLAN.md`, `PROJECT_HANDOFF.md`, `SMOKE_TEST.md`, `CHANGELOG.md`, `FIX_LOG.md`, `DECISIONS_LOG.md`, and this run log.
- Error: initial advisory allocation implementation triggered lint/build failures from an unused matcher and readonly Head Launcher assignment in the readiness helper.
- Fixes attempted: removed the stale matcher, simplified the candidate matching helpers, added empty allocation fallbacks, and switched Head Launcher selection to local mutable state before constructing the readonly summary.
- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Next recommended step: run the browser smoke test for `/`, `/dla`, and `/admin/readiness` to confirm the advisory allocation summaries and Head Launcher states render correctly.

## 2026-05-07 Restricted Reference Summary Task

- Branch: `feature/readiness-engine`
- Files changed: `docs/reference/LIFEBOAT_TRAINING_STANDARDS_NOTES.md`, `docs/reference/SAFE_CREWING_REFERENCE_NOTES.md`, `BUILD_PLAN.md`, `PROJECT_HANDOFF.md`, `SECURITY_MODEL.md`, `DECISIONS_LOG.md`, `CHANGELOG.md`, and this run log.
- Pages reviewed: `Lifeboat Training Standards Handbook TP-OCF-02.pdf` pages 10-40; `Safe Crewing for Maritime SAR Operations Guidance - GU1007.pdf` pages 1-5.
- Notes captured: training stages, pass-out and currency model, task-based competence, periodic requalification exceptions, safe-crewing crew-number baselines, minimum role complement, Head Launcher constraints, and dynamic risk assessment boundaries.
- Tests run: not yet run in this patch set.
- Next recommended step: run `npm run lint` and `npm run build`, then commit the reference-note docs.

## 2026-05-07 Restricted Reference Validation

- Tests run: `npm run lint`, `npm run build`.
- Test result: both passed.
- Working tree: clean after commit `6ef3a5e`.
- Next recommended step: no code changes required; keep the reference notes as internal-only guidance for future readiness work.

## 2026-05-07 Advisory Crew-State Split

- Branch: `feature/readiness-engine`
- Files changed: `src/lib/readiness.ts`, `src/components/readiness-board.tsx`, `BUILD_PLAN.md`, `PROJECT_HANDOFF.md`, `SMOKE_TEST.md`, `CHANGELOG.md`, `CODEX_RUN_LOG.md`, and `FIX_LOG.md`.
- Change: readiness assets now expose separate qualified crew, available crew, and allocated/suggested crew counts so the advisory allocation is clearer.
- Tests run: `npm run lint`, `npm run build`.
- Result: both passed.
- Next recommended step: browser smoke-test `/`, `/dla`, and `/admin/readiness` to confirm the new crew-state split renders correctly.
