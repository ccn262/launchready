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
