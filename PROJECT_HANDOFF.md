# Project Handoff

## Status

Launch Ready now has the initial Next.js App Router foundation, strict TypeScript, Tailwind, a dark operational design system, placeholder dashboards, and Supabase client scaffolding.

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
- WhatsApp is awareness-only and cannot be the only critical alert path.

## Immediate Next Work

1. Add Supabase auth flows and session handling.
2. Replace placeholders with crew, station, and alert data models.
3. Add audit logging write paths into the app.
4. Validate the migration locally once Docker Desktop is available.

## Verification

- `npm install` completed successfully after dependency additions.
- `npm run lint` passed.
- `npm run build` passed.
- `supabase db lint --local --fail-on error` was attempted but could not connect because the local Supabase database is not running.
- `supabase start` was attempted but Docker Desktop is not installed/running in this environment.
- The Phase 2 migration file was corrected so table-dependent helpers follow the table definitions.
- The seed file now contains the missing asset insert block and uses deterministic asset codes for idempotency.

## Run Notes

- Branch: `feature/initial-foundation`
- Delivery target: Vercel + Supabase
- Readiness gate: lint, build, and smoke tests must pass before merge
