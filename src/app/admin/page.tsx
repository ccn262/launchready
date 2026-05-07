import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { SectionShell } from "@/components/section-shell";
import Link from "next/link";
import { ArrowUpRight, Building2, MapPinned, Anchor, Users, BadgeCheck, Scale, ClipboardList, CalendarDays, Radio, MessageSquareReply } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { requireRouteAccess } from "@/lib/auth";

const adminSections = [
  {
    href: "/admin/stations",
    title: "Stations",
    description: "Organisation-scoped station records and station ownership.",
    icon: Building2,
  },
  {
    href: "/admin/locations",
    title: "Locations",
    description: "Inshore and offshore operational locations under a station.",
    icon: MapPinned,
  },
  {
    href: "/admin/assets",
    title: "Assets",
    description: "Lifeboats and launch/recovery equipment tied to a location.",
    icon: Anchor,
  },
  {
    href: "/admin/asset-types",
    title: "Asset types",
    description: "Global asset type reference data for stations and equipment.",
    icon: BadgeCheck,
  },
  {
    href: "/admin/readiness",
    title: "Readiness",
    description: "Operational visibility, gaps, and safe-crewing outputs.",
    icon: ClipboardList,
  },
  {
    href: "/admin/crew",
    title: "Crew",
    description: "Profiles, memberships, and visibility boundaries.",
    icon: Users,
  },
  {
    href: "/admin/roles",
    title: "Roles",
    description: "Operational roles applied per asset.",
    icon: BadgeCheck,
  },
  {
    href: "/admin/minimum-crewing",
    title: "Minimum crewing",
    description: "Asset-specific crewing baselines and launch authority.",
    icon: Scale,
  },
  {
    href: "/admin/qualifications",
    title: "Qualifications",
    description: "Qualification states, expiry, and currency tracking.",
    icon: ClipboardList,
  },
  {
    href: "/admin/availability",
    title: "Availability",
    description: "Day, partial, and night cover blocks for crew members.",
    icon: CalendarDays,
  },
  {
    href: "/admin/duty-rota",
    title: "Duty rota",
    description: "Station rota planning and Monday to Thursday night cover.",
    icon: Radio,
  },
  {
    href: "/admin/cover",
    title: "Cover",
    description: "Station cover requests, eligibility, and acceptance confirmation.",
    icon: MessageSquareReply,
  },
  {
    href: "/dla/incidents",
    title: "Incidents",
    description: "Launch initiation, response tracking, and incident state control.",
    icon: Radio,
  },
];

export default async function AdminPage() {
  await requireRouteAccess("/admin");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Admin section"
          title="Organisation and station management"
          summary="Admins and LOMs are scoped to their own organisation or station. The application is designed so that operational controls and personal data never drift across boundaries."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <OperationalCard
            title="Organisation scope"
            tone="blue"
            metric="Station-local"
            summary="Admin tools should manage the current organisation, its stations, and the operational locations under those stations."
            details={[
              "Station administrators should not see unrelated stations.",
              "Operational assets stay attached to their location.",
              "Audit records should identify who changed what and when.",
            ]}
          />
          <OperationalCard
            title="Security posture"
            tone="green"
            metric="RLS by default"
            summary="The initial security model assumes all personal and operational data is protected with row-level security from day one."
            details={[
              "Crew users only access their own personal data unless explicitly permitted.",
              "DLA users only manage launch alerts for their own station.",
              "Service-role access should remain tightly constrained to backend workflows.",
            ]}
          />
        </div>

        <SectionShell
          title="Admin placeholder controls"
          description="These routes map directly to the Phase 2 schema so the next build step is implementation, not redesign."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminSections.map((section) => {
              const Icon = section.icon;

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className="group rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-emerald-400/25 hover:bg-slate-950/70"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-emerald-200">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-card-foreground">
                          {section.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          {section.description}
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:text-emerald-200" />
                  </div>
                </Link>
              );
            })}
          </div>
        </SectionShell>
      </div>
    </AppShell>
  );
}
