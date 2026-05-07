import Link from "next/link";
import { redirect } from "next/navigation";
import { signInAction } from "@/app/actions";
import { getCurrentUserContext } from "@/lib/auth";

function getQueryValue(
  value: string | string[] | undefined,
  fallback = "",
) {
  if (Array.isArray(value)) {
    return value[0] ?? fallback;
  }

  return value ?? fallback;
}

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const context = await getCurrentUserContext();

  if (context.isAuthenticated) {
    redirect("/");
  }

  const params = searchParams ? await searchParams : {};
  const error = getQueryValue(params.error);
  const redirectTo = getQueryValue(params.redirectTo, "/");

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-card p-6 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.8)] sm:p-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
            Launch Ready
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-card-foreground">
            Sign in
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Use your Supabase Auth account to access crew, DLA, and admin areas.
          </p>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm leading-6 text-rose-100">
            {error}
          </div>
        ) : null}

        <form action={signInAction} className="mt-6 space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400/40"
              placeholder="name@example.com"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-card-foreground">Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-emerald-400/40"
              placeholder="Password"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-4 text-sm font-medium text-emerald-950 transition hover:bg-emerald-400"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-sm leading-6 text-muted-foreground">
          If you do not have an account yet, create the user in Supabase Auth,
          then assign the profile and station membership records.
        </p>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/" className="text-emerald-200 transition hover:text-emerald-100">
            View status
          </Link>
          <Link href="/unauthorized" className="text-muted-foreground transition hover:text-foreground">
            Access help
          </Link>
        </div>
      </section>
    </main>
  );
}
