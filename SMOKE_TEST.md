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
7. Confirm `/crew` loads for any active station member and is blocked for non-members.
8. Confirm `/dla` loads for DLA, admin, LOM, or super admin access only.
9. Confirm `/admin` loads for admin, LOM, or super admin access only.
10. Confirm `/unauthorized` renders a friendly access denied state when a route is blocked.
11. Confirm logout returns to `/login`.
12. Confirm unauthenticated visits to `/`, `/crew`, `/dla`, and `/admin` redirect to `/login`.
13. Confirm inactive profiles and inactive memberships are blocked from protected routes.

## Pass Criteria

- Lint passes with no errors.
- Build passes with no errors.
- Navigation is touch-friendly and responsive.
- No auth or Supabase runtime errors appear before environment variables are configured.
- Supabase migration lint passes locally once Docker is available.
- Phase 2 manual Supabase validation confirms the seed data and RLS baseline are correct.
- Auth/session redirect behaviour works in the browser.
- The browser smoke test covers `/login`, `/`, `/crew`, `/dla`, `/admin`, `/unauthorized`, and logout.
- Server-side route helpers block inactive profiles and insufficient role memberships even if middleware only refreshes the session.
