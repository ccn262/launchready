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
