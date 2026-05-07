# Fix Log

## 2026-05-07

- Replaced the default Next.js starter page with a Launch Ready operational dashboard shell.
- Added lazy Supabase client factories to avoid build-time client initialization.
- Fixed the generated font/theme setup to use literal font names in Tailwind theme tokens.
- Removed the drawer-close `useEffect` from the shell and closed mobile navigation directly from link clicks to satisfy lint rules.
