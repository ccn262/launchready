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
- Chosen readiness-engine model: safe-crewing and required-role rules will be effective-dated, asset-type scoped, and operation-type aware, but the system will never authorise launches.
- Chosen internal-reference rule: restricted SAR crewing guidance is treated as internal project reference only and must not be surfaced as public-facing RNLI approval or endorsement.


## 2026-05-07 Phase 6 Decisions

- Chosen availability model: keep crew and station availability on the existing `availability_slots` table, using datetime windows plus the existing slot kind pattern rather than adding a new availability table.
- Chosen rota model: keep manual weekend and duty rota foundation on the existing `duty_periods` table, with `weekend_cover`, `dla_day`, and `dla_night` as additive kinds.
- Chosen badge model: centralise asset/role badge formatting in shared helper and component files so the same labels appear consistently across availability and rota views.
- Chosen crew-write rule: crew availability writes remain crew-scoped, while station-wide availability and rota writes stay admin/LOM-scoped.

## 2026-05-07 Phase 7 Decisions

- Chosen readiness surface: expose the first readiness engine through a reusable server-rendered readiness board rather than a client-side calculator.
- Chosen rule fallback: allow `boat_movement` and `assurance_activity` to fall back to service rules until dedicated rows are introduced.
- Chosen visibility model: reuse the same readiness snapshot in `/`, `/dla`, and `/admin/readiness` so the calculated state stays consistent.

## 2026-05-07 Phase 7 Advisory Allocation Decisions

- Chosen allocation model: keep likely crew composition advisory only, and surface the output as suggested boat crew, launch/recovery crew, role conflicts, and readiness-restoration candidates.
- Chosen Head Launcher fallback: treat Head Launcher as missing until the role exists in the operational role data, rather than adding a schema dependency during Phase 7.

- Chosen documentation model: keep `TP-OCF-02` and `GU1007` as restricted internal reference summaries only, stored under `docs/reference/` and excluded from any public-facing wording or feature claims.
