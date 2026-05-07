# Decisions Log

## 2026-05-07

- Chosen stack: Next.js App Router, TypeScript strict mode, Tailwind, Supabase, Vercel, and Resend.
- Chosen shell approach: responsive server/client split with a client-side shell for navigation state.
- Chosen UI direction: dark operational dashboard with green, amber, and red state cards.
- Chosen access model: RLS-first, with all personal and station-scoped data guarded from day one.
- Chosen data model direction: roles are per asset, not global, to match operational reality.
- Chosen messaging model: WhatsApp awareness only, never the sole critical path for launch alerts.
- Chosen schema model: station-scoped operational tables with `station_memberships`, `asset_role_qualifications`, and `asset_minimum_crewing` to keep per-asset crewing explicit.
- Chosen auth model: auto-provision `profiles` rows from an `auth.users` trigger rather than relying on client-side profile creation.
- Chosen scope model: station admins and LOMs manage their own station or organisation; DLAs manage incidents and alerts only for their own station.
- Chosen reference-data model: RNLI public station pages may be considered later as read-only reference data for admin pre-population only, never as operational truth, and never as an automatic overwrite source.
- Chosen import rule: any future RNLI reference/import work must check site terms first, store source URL and last checked date, and require manual admin confirmation before using imported names/classes.
- Chosen admin CRUD scope: stations, locations, and assets are station-scoped operational records, while asset types remain super-admin-only reference data.
- Chosen notes model: `station_locations.notes` and `assets.notes` are the only new Phase 4 schema additions needed for operational notes.
- Chosen Phase 5 assignment model: `station_memberships` manages crew membership and `crew_qualifications` stores asset-specific role/currency assignments and qualification records.
- Chosen Phase 5 currency model: green, amber, and red states are shared by role assignments and qualifications so status reads consistently across the UI.
- Chosen future rota model: weekend duty rota work is deferred until the availability engine exists, and it will cover Friday 19:00 through Monday 07:00 with explicit coverage slices for Friday night, Saturday day/night, and Sunday day/night into Monday morning.
- Chosen capability badge model: reusable crew capability badge formatting will be shared across dashboards, admin pages, rotas, launch response screens, reports, and message summaries instead of being hardcoded per page.
- Chosen cover-request model: cover swap requests will be like-for-like only, station-scoped, and validated against the required asset, role, currency, qualification, availability, and rota constraints before acceptance.
