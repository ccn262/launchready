# Project Handoff

## Status

Launch Ready now has the initial Next.js App Router foundation, strict TypeScript, Tailwind, a dark operational design system, placeholder dashboards, Supabase client scaffolding, a manually validated Phase 2 Supabase schema/RLS foundation, the Phase 3 auth/session foundation, the Phase 4 admin CRUD foundation for stations, locations, asset types, and assets, the Phase 5 crew/roles/qualification foundation, and the Phase 6 availability/night-cover/weekend-rota foundation.

## What Exists

- `src/app/layout.tsx` sets global metadata and fonts.
- `src/app/page.tsx`, `src/app/crew/page.tsx`, `src/app/dla/page.tsx`, and `src/app/admin/page.tsx` provide the initial shell and section entry points.
- `src/app/admin/stations/page.tsx`, `src/app/admin/locations/page.tsx`, `src/app/admin/asset-types/page.tsx`, and `src/app/admin/assets/page.tsx` now provide the first real admin CRUD surfaces.
- `src/app/admin/crew/page.tsx`, `src/app/admin/roles/page.tsx`, and `src/app/admin/qualifications/page.tsx` now provide the crew membership, operational role, and qualification management surfaces.
- `src/app/crew/availability/page.tsx`, `src/app/crew/rota/page.tsx`, `src/app/admin/availability/page.tsx`, and `src/app/admin/duty-rota/page.tsx` now provide the first availability, weeknight cover, and weekend duty rota foundation surfaces.
- `src/components/crew-capability-badges.tsx` and `src/lib/capability-badges.ts` provide reusable asset/role badge rendering for the current and future rota views.
- `src/components/app-shell.tsx` implements the responsive sidebar and mobile drawer.
- `src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts` provide lazy Supabase client factories.
- The required governance documents now exist in the repository root.

## Working Assumptions

- Supabase row-level security is the primary access-control boundary.
- Personal data is never exposed cross-user unless a policy explicitly allows it.
- Admin and DLA permissions are station-scoped.
- Inactive profiles and inactive memberships are blocked before route access is granted.
- Edge middleware only refreshes the session and handles login redirects; server-side route helpers enforce detailed access control.
- Edge middleware now fails closed on missing Supabase config or session refresh errors and skips static/public asset requests via the matcher.
- Admin CRUD access is station-scoped for admin and LOM memberships, while asset types remain super-admin reference data.
- Crew management, asset-specific role assignment, and qualification tracking are station-scoped for admins and LOMs, with DLA visibility remaining database-scoped rather than management-scoped.
- WhatsApp is awareness-only and cannot be the only critical alert path.
- `.env.local` is local-only and must never be committed.
- Safe crewing guidance is treated as a restricted internal reference for future readiness work only and must not be exposed as public-facing RNLI approval.

## Immediate Next Work

1. Complete manual Supabase Auth setup.
2. Verify sign-in, sign-out, and redirect handling in the browser.
3. Continue Phase 3 route and session hardening.
4. Complete Phase 4 CRUD smoke testing for stations, locations, asset types, and assets.
5. Validate Phase 5 crew, role, and qualification management in the browser.
6. Complete browser smoke testing for the Phase 6 availability and rota foundation routes.
7. Replace the remaining placeholders with alert, readiness, and rota data models.
8. Add audit logging write paths into the app.
9. Keep RNLI public station reference/import in the future backlog until the CRUD and readiness engine are stable.
10. Keep weekend duty rota, crew capability badges, and cover/swap request work in the backlog until the availability engine and rota foundation are ready.
11. Keep the future readiness engine aligned to safe-crewing reference rules, minimum role complements, launch/recovery checks, and dynamic risk assessment boundaries.
12. Verify the Vercel preview redeploy for the middleware fix, then merge the published branches in order once review is complete.

## Verification

- `npm install` completed successfully after dependency additions.
- `npm run lint` passed.
- `npm run build` passed.
- The Phase 2 migration file was corrected so table-dependent helpers follow the table definitions.
- The seed file now contains the missing asset insert block and uses deterministic asset codes for idempotency.
- Manual Supabase validation completed successfully against project `yhddbkkjpyeetihrlxrw`.
- The Phase 2 schema/RLS work is safe to merge into `develop`.
- Phase 3 auth/session work now protects `/`, `/crew`, `/dla`, and `/admin`.
- Phase 3 access checks now rely on `profiles.display_name`, `profiles.system_role`, `station_memberships.profile_id`, and `station_memberships.membership_role`.
- `/unauthorized` is the blocked-access landing page and should not bounce users back into a redirect loop.
- The Vercel Edge middleware bundle is now self-contained and no longer imports server-only auth helpers.
- The Vercel Edge middleware now fails closed instead of throwing a 500 if Supabase config or session refresh fails.
- RNLI public station pages are a future reference source only, with manual admin confirmation required and no operational overwrite.
- GitHub branches are now published and draft PRs exist for schema/RLS and auth/session work.
- Phase 4 adds real admin CRUD pages for stations, locations, asset types, and assets.
- `station_locations.notes` and `assets.notes` were added so admins can capture operational notes without reworking the base schema.
- Phase 5 adds station crew management plus asset-specific role and qualification assignment using the existing `station_memberships` and `crew_qualifications` tables.
- Weekend duty rota management is deferred until the availability engine is ready, and it must cover Friday 19:00 through Monday 07:00.
- Crew capability badges must be reused everywhere instead of being reimplemented per page.
- The Phase 6 foundation uses the existing `availability_slots` and `duty_periods` tables with `starts_at`, `ends_at`, and `created_by_profile_id` support to keep the rota work lightweight and reviewable.
- Cover and swap requests must remain like-for-like only and audit logged when they are introduced.
- The future readiness engine must support effective-dated safe-crewing rules, required-role complements, launch method checks, and non-authorising risk assessment states.
- Phase 7 now adds a dedicated readiness console plus dashboard and DLA readiness views on `feature/readiness-engine`; it still needs browser smoke testing before merge.
- The Phase 7 seed file now runs cleanly in Supabase SQL Editor after fixing the launch/recovery join ordering issue.
- The readiness engine now includes advisory allocation output for likely boat crew, likely launch/recovery crew, role conflicts, crew who could restore readiness, and explicit Head Launcher status. This is advisory only and does not authorise launches.

## Run Notes

- Branch: `feature/initial-foundation`
- Delivery target: Vercel + Supabase
- Readiness gate: lint, build, and smoke tests must pass before merge

- Restricted internal reference summaries now live under `docs/reference/` for `TP-OCF-02` and `GU1007`; they are internal project notes only and must not be surfaced as public-facing RNLI approval.
