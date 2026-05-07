# Project Handoff

## Status

Launch Ready now has the initial Next.js App Router foundation, strict TypeScript, Tailwind, a dark operational design system, placeholder dashboards, Supabase client scaffolding, a manually validated Phase 2 Supabase schema/RLS foundation, and the Phase 3 auth/session foundation in progress.

## What Exists

- `src/app/layout.tsx` sets global metadata and fonts.
- `src/app/page.tsx`, `src/app/crew/page.tsx`, `src/app/dla/page.tsx`, and `src/app/admin/page.tsx` provide the initial shell and section placeholders.
- `src/components/app-shell.tsx` implements the responsive sidebar and mobile drawer.
- `src/lib/supabase/browser.ts` and `src/lib/supabase/server.ts` provide lazy Supabase client factories.
- The required governance documents now exist in the repository root.

## Working Assumptions

- Supabase row-level security is the primary access-control boundary.
- Personal data is never exposed cross-user unless a policy explicitly allows it.
- Admin and DLA permissions are station-scoped.
- Inactive profiles and inactive memberships are blocked before route access is granted.
- WhatsApp is awareness-only and cannot be the only critical alert path.
- `.env.local` is local-only and must never be committed.

## Immediate Next Work

1. Complete manual Supabase Auth setup.
2. Verify sign-in, sign-out, and redirect handling in the browser.
3. Continue Phase 3 route and session hardening.
4. Replace placeholders with crew, station, and alert data models.
5. Add audit logging write paths into the app.
6. Keep RNLI public station reference/import in the future backlog until the CRUD and readiness engine are stable.
7. Merge the published branches in order once review is complete.

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
- RNLI public station pages are a future reference source only, with manual admin confirmation required and no operational overwrite.
- GitHub branches are now published and draft PRs exist for schema/RLS and auth/session work.

## Run Notes

- Branch: `feature/initial-foundation`
- Delivery target: Vercel + Supabase
- Readiness gate: lint, build, and smoke tests must pass before merge
