# Environment Setup

## Required Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for server-only scripts only if needed
- `NEXT_PUBLIC_RESEND_API_KEY`
- `RESEND_FROM_ADDRESS`
- `NEXT_PUBLIC_APP_URL`

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase project URL and anon key.
3. Add the server-only service role key only if you need scripts that cannot use the anon key.
4. Add the Resend API key and from-address when email alerts are enabled.
5. Run `npm install`.
6. Start the app with `npm run dev`.
7. Keep `.env.local` out of version control. It must never be committed.

## Supabase Setup

- Project ID: `yhddbkkjpyeetihrlxrw`
- Project URL: `https://yhddbkkjpyeetihrlxrw.supabase.co`
- Use migrations for schema changes.
- Enable RLS before data goes live.
- Add policies before seeding operational data.
- Create Supabase Auth users and station memberships before testing protected routes.

## Manual Auth Setup

1. Confirm the Supabase Auth site URL points at the deployed app or local dev server.
2. Add the login redirect URLs used by the app.
3. Create at least one test user in Supabase Auth.
4. Create the matching `profiles` row if the trigger has not yet run for the user.
5. Add a `station_memberships` row for the user so protected routes can be exercised.
6. Optionally mark one profile as `super_admin` for cross-station validation.

## Vercel Setup

- Link the repository to Vercel.
- Configure production environment variables.
- Prepare preview and production secrets separately.
- Ensure deployment checks require lint and build success.
- Edge middleware should only handle session refresh and login redirects; detailed route authorization remains on the server.
