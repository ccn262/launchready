# Smoke Test

## Goals

- Confirm the app boots locally.
- Confirm the dashboard shell renders on mobile and desktop.
- Confirm navigation between the four core sections works.
- Confirm there are no console errors or build-time TypeScript issues.

## Steps

1. Run `npm install`.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Open the app and verify the dashboard hero, sidebar, and cards render.
5. Check the crew, DLA, and admin routes render their placeholders.

## Pass Criteria

- Lint passes with no errors.
- Build passes with no errors.
- Navigation is touch-friendly and responsive.
- No auth or Supabase runtime errors appear before environment variables are configured.
