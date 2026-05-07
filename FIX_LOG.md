# Fix Log

## 2026-05-07

- Replaced the default Next.js starter page with a Launch Ready operational dashboard shell.
- Added lazy Supabase client factories to avoid build-time client initialization.
- Fixed the generated font/theme setup to use literal font names in Tailwind theme tokens.
- Removed the drawer-close `useEffect` from the shell and closed mobile navigation directly from link clicks to satisfy lint rules.

## 2026-05-07 Phase 2

- Added the first Supabase schema and RLS migration file plus safe development seed data.
- Added admin placeholder routes for the schema areas introduced in Phase 2.
- Fixed an unused import in the admin overview after the first lint pass.
- Attempted local Supabase validation, but Docker Desktop is not available in this environment.
