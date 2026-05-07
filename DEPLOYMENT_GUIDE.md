# Deployment Guide

## Target Platform

- Vercel for frontend hosting and server rendering.
- Supabase for auth, Postgres, realtime, and RLS enforcement.
- Resend for email notifications.

## Deployment Flow

1. Merge only after lint, build, and smoke tests pass.
2. Apply Supabase migrations first.
3. Verify RLS policies in the target environment.
4. Deploy to Vercel.
5. Run a smoke test against the deployed app.

## Operational Notes

- Never merge directly to `main`.
- Keep `develop` as the integration branch.
- Use `feature/*`, `fix/*`, and `release/*` branches for work.
- Log all schema and security changes in the dedicated docs.

## Release Checks

- Dashboard shell loads without console errors.
- Auth flow works against the configured Supabase project.
- Alert and audit writes are scoped correctly.
- Mobile navigation is usable without a pointer device.
