"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRight,
  LifeBuoy,
  Menu,
  Radio,
  ShieldAlert,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[1680px]">
        <aside className="hidden w-80 shrink-0 border-r border-border/70 bg-slate-950/45 px-5 py-6 lg:flex lg:flex-col">
          <div className="flex items-start justify-between gap-3 pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                <LifeBuoy className="h-3.5 w-3.5" />
                Operational readiness
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">
                  Launch Ready
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Multi-station, multi-location lifeboat coordination.
                </p>
              </div>
            </div>
          </div>

          <nav aria-label="Primary" className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const active =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl border px-4 py-3 transition",
                      active
                      ? "border-emerald-400/30 bg-emerald-400/10"
                      : "border-transparent bg-white/0 hover:border-white/10 hover:bg-white/5",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                      active
                        ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
                        : "border-white/10 bg-white/5 text-muted-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-card-foreground">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 rounded-3xl border border-sky-400/20 bg-sky-400/10 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-sky-100">
              <ShieldAlert className="h-4 w-4" />
              Security baseline
            </div>
            <p className="mt-2 text-sm leading-6 text-sky-100/80">
              RLS-first access control, audit logging for operational actions,
              and station-scoped permissions from day one.
            </p>
          </div>

          <div className="mt-auto pt-6 text-xs leading-5 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5" />
              Email, in-app, SMS placeholder, WhatsApp awareness only.
            </div>
            <p className="mt-3">
              Critical launch alerts must remain independent of any single
              messaging channel.
            </p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur md:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                  Launch Ready
                </p>
                <h1 className="text-base font-semibold">Operational shell</h1>
              </div>
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-foreground"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-slate-950/70"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(88vw,20rem)] flex-col border-r border-border/70 bg-slate-950 px-5 py-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 pb-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  <LifeBuoy className="h-3.5 w-3.5" />
                  Launch Ready
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Navigation
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Station-scoped operational access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav aria-label="Mobile primary" className="space-y-2">
              {NAV_ITEMS.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-2xl border px-4 py-3",
                      active
                        ? "border-emerald-400/30 bg-emerald-400/10"
                        : "border-white/10 bg-white/5",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl border",
                          active
                            ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
                            : "border-white/10 bg-white/5 text-muted-foreground",
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-medium">{item.label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
