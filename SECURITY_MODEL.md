# Security Model

## Principles

- RLS is mandatory from day one.
- Personal data is only accessible to the owning crew user unless a policy explicitly permits it.
- Admins and LOMs only manage their own organisation and station scope.
- DLA users only manage launch alerts for their own station.
- Operational audit logging is required for important changes.

## Data Classes

- Personal crew data: identity, contact details, availability, qualifications, notes, and expiry dates.
- Operational station data: organisations, stations, locations, assets, rota assignments, and alert state.
- Audit data: actor, action, target, timestamp, and before/after context where appropriate.

## Access Model

- Crew users can read and update only their own profile-linked records unless a station policy says otherwise.
- Station admins can manage assets, locations, and station crew only within their station.
- DLA users can create and manage launch alerts only within their station.
- Service-role access is reserved for trusted backend workflows and should be tightly constrained.

## Required Controls

- Row-level policies on every table containing user or operational data.
- Server-side session handling via Supabase Auth.
- Audit rows for create, update, delete, alert, and role-scope changes.
- No reliance on WhatsApp as the sole critical alert route.

## Phase 2 RLS Baseline

- `profiles` is auto-created from an auth.users trigger and remains private by default.
- Crew can only update their own profile unless a station admin or LOM role is explicitly granted access.
- Station access is derived from `station_memberships`.
- `can_manage_station` covers station admins and LOMs.
- `can_manage_organisation` covers organisation-scoped admins and LOMs.
- DLA access is station-scoped and limited to incidents, availability visibility, and operational alerting.
- Audit logs are append-only.
- No table is publicly readable without an authenticated policy.

## Phase 2 Validation

- Phase 2 was manually validated in Supabase project `yhddbkkjpyeetihrlxrw`.
- The Southend demo data and RLS baseline are considered ready for integration into `develop`.

## Phase 3 Auth Baseline

- Supabase Auth is the source of truth for session state.
- The browser never receives a service role key.
- Middleware protects the authenticated routes and handles redirects for unauthorised access.
- Login and logout are server-action driven.
- Current user/profile loading happens on the server before rendering the shell.
