import Link from "next/link";
import { signOutAction } from "@/app/actions";

function getQueryValue(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export default async function UnauthorizedPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const params = searchParams ? await searchParams : {};
  const reason = getQueryValue(params.reason, "You are not authorised to access this page.");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-card p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)] sm:p-8">
        <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
          Access restricted
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-card-foreground">
          Unauthorized
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{reason}</p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
          >
            Return home
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
          >
            Go to login
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-foreground transition hover:bg-white/10"
            >
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
