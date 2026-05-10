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

## Phase 7 Smoke Test

- Dashboard loads readiness cards at `/`.
- Southend Inshore and Southend Offshore / Pier assets display readiness and missing roles.
- Crew with green asset roles count toward readiness.
- Crew with amber or red asset roles do not count as launch-ready.
- Unavailable crew do not count.
- Expired qualifications do not count where required.
- Launch/recovery gaps display separately from boat crew gaps.
- DLA and admin users can open `/dla` and `/admin/readiness`.
- Non-members cannot access station readiness.
- The readiness board shows advisory-only likely boat crew, likely launch/recovery crew, role conflicts, crew who could restore readiness, and Head Launcher status.
- Head Launcher renders as missing until the role exists in data, then it should show available or conflict states as appropriate.
- Readiness UI now shows qualified crew, available crew, and suggested allocation as separate operational indicators for each asset card.
- Browser smoke testing should confirm that protected routes redirect cleanly to `/login` when no likely Supabase auth cookie is present and that `/login` remains public.
- Browser smoke testing should confirm `/login` stays public, authenticated users are redirected by the login page itself, and stale cookies no longer create a `/login` ↔ `/` loop.

## Phase 8 Smoke Test

- Crew can open `/crew/cover`.
- Crew can create a cover request for a weekend, day, night, or custom time window.
- Crew can see their own open cover requests and station open cover requests.
- General station cover requests display clearly even when no asset or operational role is assigned.
- Crew cannot accept their own request.
- Eligible crew can offer or accept cover when the request is like-for-like.
- Ineligible crew are blocked or marked `needs_admin_review`.
- Admin can open `/admin/cover`.
- Admin can view open, urgent, accepted, and cancelled cover requests for the station.
- Admin can view recent/past cover requests, including accepted, cancelled, and expired rows.
- Admin can confirm or cancel cover requests where permitted.
- DLA can view cover request awareness without managing requests unless also admin or LOM.
- Cover request creation writes an audit log entry.
- Cover request creation writes a notification placeholder row.
- Cross-station access remains blocked by RLS.
- No hard delete is exposed for cover requests or responses.

## Phase 8 Pass Criteria

- Lint passes with no errors.
- Build passes with no errors.
- `cover_requests` and `cover_request_responses` remain station-scoped and RLS-protected.
- Like-for-like eligibility remains advisory only and never authorises a launch.
- No real WhatsApp, SMS, or email sending is enabled yet.

## Phase 8 Visibility Check

- `/crew/cover` shows current and future open requests for the selected station, including general station cover with no asset or role.
- `/admin/cover` shows current and future open requests, plus accepted, cancelled, and historical rows.
- `/`, `/dla`, `/crew/cover`, and `/admin/cover` render fresh cover-request counts rather than a stale empty snapshot.
- Development-only debug output shows selected station, current profile, loaded request count, and visible open request count.

## Phase 9 Smoke Test

- `/dla/launch` loads a launch draft form and readiness preview for the selected station, location, and assets.
- DLA/admin can create a launch draft and see the current readiness snapshot before initiation.
- Missing hard-stop roles, launch/recovery gaps, and Head Launcher status are visible before initiation.
- DLA/admin can initiate a launch placeholder and create incident, incident-asset, readiness-snapshot, notification, and audit-log records.
- `/dla/incidents` shows active incidents, crew response counts, and stand down / close controls for the station.
- `/crew/incidents` shows active station incidents and allows the logged-in crew member to submit attending, not attending, delayed, or fallback responses.
- `/` shows active incident awareness without implying launch authorisation.
- Cross-station incident access remains blocked by RLS and route helpers.

## Phase 9 Pass Criteria

- Launch initiation remains advisory only and never authorises a launch.
- Readiness snapshots are stored at initiation time and can be reviewed later.
- Crew responses are station-scoped and only apply to the logged-in profile.
- Notification rows are placeholders only and no external messages are sent yet.

## Demo Seed Test Notes

- Run `supabase/demo-seed.sql` in Supabase SQL Editor after the base schema and seed have already been applied.
- Use the demo seed only for development and browser testing; it is not production data.
- The demo seed creates `public.profiles` rows only, so login testing still requires matching Supabase Auth users to be created separately.
- If you want the SQL Editor steps: open Supabase, choose the project, paste `supabase/demo-seed.sql` into a new SQL query, run it, and then execute the verification SQL from `CODEX_RUN_LOG.md`.
- Verify the Southend demo rows with the SQL listed in `CODEX_RUN_LOG.md` before browser-testing the Phase 9 workflow.
- Browser test the demo data on `/dla/launch`, `/dla/incidents`, `/crew/incidents`, `/crew/cover`, `/admin/cover`, and the readiness views.
