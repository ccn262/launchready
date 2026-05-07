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


## Phase 6

- Build the availability calendar foundation for crew and station admins.
- Support full-day, partial-day, night-cover, and weekend-unavailable availability windows.
- Support Monday to Thursday night cover and foundation-level weekend duty rota views.
- Add reusable crew capability badge rendering for asset-specific roles and currency states.
- Status: availability and rota foundation added; browser smoke testing and merge review pending.

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

## Future Phase: Readiness Engine

- Add a future readiness engine only after availability, rota, and crew capability foundations are stable.
- Support safe-crewing rules by asset type and operation type using effective-date aware reference data.
- Model operation types including service, exercise, passage, boat_movement, and assurance_activity.
- Track minimum crew, maximum crew, darkness minimum crew where applicable, source reference, notes, and effective date ranges.
- Check required roles separately from crew count, with hard-stop, required, and preferred role levels.
- Support launch/recovery capability separately from operating boat crew.
- Capture launch method context where needed, including afloat_alongside, afloat_mooring, floating_dock, hydraulic_lift, ilb_davit, alb_carriage, slipway, tractor, winch, davit, and remote_site.
- Show service-ready, exercise-only, delayed-launch, and off-service states without authorising launches.
- Require dynamic risk assessment, approving authority, reason, notes, and service-return logging for exceptions, while never overriding hard-stop role requirements.

## Phase 7

- Status: readiness engine foundation is now built on `feature/readiness-engine`.
- Calculate station, location, and asset readiness using availability, rota, qualifications, asset-specific roles, and safe-crewing roadmap data.
- Surface missing hard-stop roles, required roles, preferred gaps, launch/recovery gaps, and current DLA context.
- Add an admin readiness console so calculated readiness can be reviewed without authorising launches.
- Add advisory likely crew composition so the readiness view can suggest likely boat crew, likely launch/recovery crew, role conflicts, crew who could restore readiness, and explicit Head Launcher status without authorising launches.

- Restricted internal reference notes have been created for `TP-OCF-02` and `GU1007` to inform future readiness, currency, and safe-crewing work without exposing long copied text or public-facing approval claims.

- The readiness board now distinguishes qualified crew, available crew, and suggested allocation for each asset so advisory allocation is explicit instead of implied.

## Phase 8

- Build the cover / swap request foundation after readiness and rota work are stable.
- Support weekend, day, night, and custom cover requests with like-for-like eligibility checks.
- Keep notifications as placeholders only until messaging channels are ready.
- Surface open and urgent cover requests on dashboard, crew, admin, and DLA awareness views.
- Audit-log cover request, response, acceptance, and cancellation actions.
- Keep cover acceptance advisory only and never treat it as launch authorisation.
