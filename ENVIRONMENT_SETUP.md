# Environment Setup

## Required Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RESEND_API_KEY`
- `RESEND_FROM_ADDRESS`
- `NEXT_PUBLIC_APP_URL`

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase project URL and anon key.
3. Add the Resend API key and from-address when email alerts are enabled.
4. Run `npm install`.
5. Start the app with `npm run dev`.

## Supabase Setup

- Project ID: `yhddbkkjpyeetihrlxrw`
- Use migrations for schema changes.
- Enable RLS before data goes live.
- Add policies before seeding operational data.

## Vercel Setup

- Link the repository to Vercel.
- Configure production environment variables.
- Prepare preview and production secrets separately.
- Ensure deployment checks require lint and build success.
