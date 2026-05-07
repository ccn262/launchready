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
- Status: schema and RLS foundation added; local Supabase validation blocked until Docker Desktop is available.

## Phase 3

- Build crew availability and qualification workflows.
- Build DLA launch-alert and night rota workflows.
- Add realtime dashboards and alert delivery.
- Add email integration through Resend.

## Phase 4

- Add operational reporting and readiness calculations.
- Add push, SMS placeholder, and WhatsApp awareness orchestration.
- Prepare PWA support.
- Hardening, testing, and release preparation.
