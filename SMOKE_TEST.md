# Smoke Test

## Goals

- Confirm the app boots locally.
- Confirm the dashboard shell renders on mobile and desktop.
- Confirm navigation between the four core sections works.
- Confirm there are no console errors or build-time TypeScript issues.
- Confirm the Supabase migration can be linted locally when Docker Desktop is available.

## Steps

1. Run `npm install`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Run `supabase db lint --local --fail-on error` once Docker Desktop is running.
5. Sign in via `/login` with a Supabase Auth user.
6. Confirm `/` loads the authenticated dashboard shell.
7. Confirm `/crew`, `/dla`, and `/admin` are protected by middleware.
8. Confirm logout returns to `/login`.

## Pass Criteria

- Lint passes with no errors.
- Build passes with no errors.
- Navigation is touch-friendly and responsive.
- No auth or Supabase runtime errors appear before environment variables are configured.
- Supabase migration lint passes locally once Docker is available.
- Phase 2 manual Supabase validation confirms the seed data and RLS baseline are correct.
- Auth/session redirect behaviour works in the browser.
