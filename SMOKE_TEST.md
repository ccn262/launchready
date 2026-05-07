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
14. Confirm the deployed Vercel preview does not return a middleware 500 on protected routes.
15. Confirm static assets such as images, icons, and CSS files still load normally with the middleware matcher in place.
16. Confirm `/admin/stations` lists visible stations and allows permitted edits.
17. Confirm `/admin/locations` shows Southend locations and allows create/edit with notes.
18. Confirm `/admin/asset-types` lists the global asset type reference set and only super admins can edit it.
19. Confirm `/admin/assets` lists Southend assets, allows create/edit, and preserves duplicate asset names across different locations.
20. Confirm duplicate `D Class` assets can exist at both Southend locations when `asset_code` remains unique per station.
21. Confirm non-admin users cannot access the admin CRUD pages.
22. Confirm `/admin/crew` lists station crew and allows editing a membership.
23. Confirm `/admin/roles` allows assigning D Class and B Class roles with different currency states to the same crew member.
24. Confirm `/admin/qualifications` allows setting Casualty Care expiry and clearly flags expired or near-expiry records.
25. Confirm `/crew/availability` allows crew to create full-day, partial-day, and night-cover availability windows.
26. Confirm `/crew/availability` allows marking weekend unavailability and shows capability badges.
27. Confirm `/crew/rota` shows assigned rota periods and capability badges for the selected station.
28. Confirm `/admin/availability` shows station-wide availability and allows station-scoped edits.
29. Confirm `/admin/duty-rota` allows manually assigning weekend cover and DLA day/night duty periods.
30. Confirm DLA access still follows the agreed security model and does not grant management access to the admin pages.

## Pass Criteria

- Lint passes with no errors.
- Build passes with no errors.
- Navigation is touch-friendly and responsive.
- No auth or Supabase runtime errors appear before environment variables are configured.
- Supabase migration lint passes locally once Docker is available.
- Phase 2 manual Supabase validation confirms the seed data and RLS baseline are correct.
- Auth/session redirect behaviour works in the browser.
- The browser smoke test covers `/login`, `/`, `/crew`, `/dla`, `/admin`, `/unauthorized`, and logout.
- The browser smoke test also covers `/admin/stations`, `/admin/locations`, `/admin/asset-types`, and `/admin/assets`.
- The browser smoke test also covers `/admin/crew`, `/admin/roles`, and `/admin/qualifications`.
- The browser smoke test also covers `/crew/availability`, `/crew/rota`, `/admin/availability`, and `/admin/duty-rota`.
- Server-side route helpers block inactive profiles and insufficient role memberships even if middleware only refreshes the session.
