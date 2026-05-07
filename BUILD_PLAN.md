# Build Plan

## Phase 1

- Create the App Router foundation.
- Establish strict TypeScript and Tailwind styling.
- Scaffold the dashboard shell, sidebar, and role placeholders.
- Add Supabase client setup and environment templates.
- Write the core governance documents.
- Status: complete.

## Phase 2

- Add Supabase auth.
- Create organisations, stations, locations, assets, and crew tables.
- Implement RLS policies for all user-scoped data.
- Add audit logging for operational actions.
- Status: schema, seed, and RLS foundation added; manually validated in Supabase and safe to merge into `develop`.

## Phase 3

- Build auth/session foundation.
- Add login and logout flows.
- Add route protection and role-aware navigation.
- Add current user/profile loading and unauthorised handling.
- Status: auth/session foundation is on `develop`; route checks are split so Edge middleware handles session routing and server pages enforce detailed access control.

## Phase 4

- Build admin CRUD for stations, locations, asset types, and assets.
- Keep access station-scoped for admins and LOMs, with super admin reference-data control.
- Preserve duplicate asset names across different locations with unique station asset codes.
- Add only the required operational notes fields for locations and assets.
- Future backlog item: RNLI public station reference/import for admin pre-population only, with manual confirmation/editing and no operational overwrite.
- Check RNLI website terms before any scraping or automated import work.
- Add operational reporting and readiness calculations after CRUD stabilises.
- Add push, SMS placeholder, and WhatsApp awareness orchestration later.
- Prepare PWA support after the core admin workflow is complete.
- Hardening, testing, and release preparation.

## Phase 5

- Build crew management for station memberships and active status.
- Build asset-specific role and currency assignment per crew member.
- Build qualification management with expiry-aware casualty care tracking.
- Keep role and qualification management station-scoped for admins and LOMs.
- Keep operational role reference data and qualification reference data aligned with the existing schema.
- Manual browser smoke testing and hardening.

## Future Phase: Weekend Duty Rota

- Add weekend duty rota management after the availability engine is ready.
- Support weekend duty periods from Friday 19:00 through Monday 07:00.
- Let crew submit weekend unavailability and let admins or rota managers build the rota manually or with assisted generation.
- Show coverage for Friday night, Saturday daytime, Saturday night, Sunday daytime, and Sunday night into Monday 07:00.
- Surface boat crew, shore crew, role coverage, asset coverage, gaps, and missing roles clearly.

## Future Phase: Crew Capability Badges

- Create reusable crew capability badge rendering for dashboards, reports, rotas, availability calendars, launch response screens, and message summaries.
- Support concise asset and role badge formatting such as `B(T1)`, `D(H)`, `H(P)`, `Tr(DR)`, `W(OP)`, and `Dav(OP)`.
- Colour code badges using green, amber, red, and grey states.
- Avoid duplicating badge formatting logic page by page.

## Future Phase: Cover and Swap Requests

- Add a cover request system only after crew roles, availability, and rota foundations are stable.
- Support full weekend, single day, single night, and custom time-window cover requests.
- Show open cover requests, urgent cover needs, required role/asset, and eligible cover crew on dashboards.
- Validate like-for-like cover only: same station, same asset, same operational role, current currency, in-date qualifications, available for the window, and no conflicting rota assignment.
- Audit log all cover request and acceptance actions, and notify the requester, the accepting crew member, and the relevant admin or DLA.
- Keep WhatsApp awareness-only and never the sole cover notification path.
