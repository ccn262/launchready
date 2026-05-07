export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="h-12 w-56 animate-pulse rounded-2xl bg-white/10" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/5" />
        </div>
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-24 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  );
}
