import { Building2, Clock3, Radio, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import { requireRouteAccess } from "@/lib/auth";

const referenceStations = [
  {
    name: "Southend Inshore Station",
    status: "green" as const,
    assets: ["Tractor", "D Class", "Hovercraft", "RNLI Buggy 1", "RNLI Buggy 2", "Winch"],
  },
  {
    name: "Southend Offshore / Pier Station",
    status: "amber" as const,
    assets: ["D Class", "B Class", "Davit"],
  },
];

export default async function DashboardPage() {
  await requireRouteAccess("/");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Operational dashboard"
          title="Crew, cover, and launch readiness in one view"
          summary="Launch Ready is structured for station-scoped permissions, asset-specific qualifications, live availability, and operational alerting. Southend is the reference model for multi-location support."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <StatusPill tone="green">Green</StatusPill>
              <Building2 className="h-5 w-5 text-emerald-300" />
            </div>
            <p className="mt-4 text-3xl font-semibold">2 stations</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Southend-style multi-location structure with independent assets.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <StatusPill tone="amber">Amber</StatusPill>
              <Clock3 className="h-5 w-5 text-amber-300" />
            </div>
            <p className="mt-4 text-3xl font-semibold">Night rota</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Monday to Thursday duty cover is supported in the model.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <StatusPill tone="red">Red</StatusPill>
              <ShieldCheck className="h-5 w-5 text-rose-300" />
            </div>
            <p className="mt-4 text-3xl font-semibold">RLS-first</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Personal data remains station- and role-scoped from day one.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <StatusPill tone="blue">Blue</StatusPill>
              <Radio className="h-5 w-5 text-sky-300" />
            </div>
            <p className="mt-4 text-3xl font-semibold">Alerts</p>
            <p className="mt-2 text-sm text-muted-foreground">
              In-app, email, SMS placeholder, WhatsApp awareness, push later.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <OperationalCard
            title="Crew readiness"
            tone="green"
            metric="91%"
            summary="Crew availability is modelled as full-day, partial-day, and night cover with asset-specific qualifications and expiry-aware status."
            details={[
              "Boat crew and shore crew are separate cover types.",
              "Qualification currency supports green, amber, and red states.",
              "Operational notes and casualty care can be attached to crew profiles.",
            ]}
          />

          <OperationalCard
            title="Launch alert health"
            tone="amber"
            metric="4 channels"
            summary="Launch alerts are designed around resilient operational delivery. WhatsApp is awareness-only and cannot be the sole critical path."
            details={[
              "In-app notifications are the primary internal control plane.",
              "Email uses Resend for reliable operational messaging.",
              "SMS, push, and WhatsApp awareness slots are prepared for later integration.",
            ]}
          />
        </div>

        <SectionShell
          title="Southend reference station model"
          description="Assets are scoped to locations, and recovery or launch equipment is treated as an operational asset rather than an afterthought."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            {referenceStations.map((station) => (
              <div
                key={station.name}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-card-foreground">
                      {station.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {station.status === "green"
                        ? "Fully staffed reference model"
                        : "Active secondary operational location"}
                    </p>
                  </div>
                  <StatusPill tone={station.status}>{
                    station.status === "green" ? "Ready" : "Review"
                  }</StatusPill>
                </div>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {station.assets.map((asset) => (
                    <li
                      key={asset}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-muted-foreground"
                    >
                      {asset}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionShell>

        <div className="grid gap-4 md:grid-cols-3">
          <SectionShell
            title="Operational roles"
            description="Roles are per asset, not global."
          >
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>D Class Helm</li>
              <li>B Class Navigator</li>
              <li>Tractor Driver</li>
              <li>Hovercraft Crew</li>
            </ul>
          </SectionShell>

          <SectionShell
            title="Coverage windows"
            description="Day and night availability are stored as explicit time blocks."
          >
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>07:00–19:00 full-day cover</li>
              <li>07:00–12:00 and 16:00–19:00 partial cover</li>
              <li>19:00–07:00 night cover</li>
            </ul>
          </SectionShell>

          <SectionShell
            title="Operational controls"
            description="Initial application controls are designed for auditing and clarity."
          >
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>Audit logging on operational actions</li>
              <li>Station-scoped admin and DLA permissions</li>
              <li>Future PWA and realtime dashboard support</li>
            </ul>
          </SectionShell>
        </div>
      </div>
    </AppShell>
  );
}
