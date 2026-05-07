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
