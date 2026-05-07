import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";
import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth";

export default async function CrewPage() {
  await requireRouteAccess("/crew");

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="Crew section"
          title="Availability and qualifications by crew member"
          summary="Crew records are built for personal-data protection, asset-specific roles, expiry tracking, and clear availability windows."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <OperationalCard
            title="Crew availability"
            tone="green"
            metric="Full day + partial"
            summary="Crew can declare 07:00–19:00, split-day, or night cover. Calendar views should show who is covering, what role they hold, what asset they support, and which location they support."
            details={[
              "Boat crew and shore crew stay distinct in the model.",
              "Night cover can be rotated Monday to Thursday.",
              "Coverage windows will be usable in both list and calendar views.",
            ]}
          />
          <OperationalCard
            title="Qualification currency"
            tone="amber"
            metric="Green / amber / red"
            summary="Roles are not global. A crew member may be a D Class Helm on one asset and a Tractor Driver on another, with separate qualification states."
            details={[
              "Each qualification can carry an expiry date.",
              "Operational notes can flag restrictions, endorsements, or pending refreshers.",
              "Casualty care is modelled alongside operational qualifications.",
            ]}
          />
        </div>

        <SectionShell
          title="Crew record placeholder"
          description="This section is intentionally scoped for authenticated crew users only."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Personal data", "Protected by RLS and limited to the crew member's own record."],
              ["Availability", "Declared cover windows, rota participation, and exceptions."],
              ["Asset roles", "Per-asset qualifications with status, expiry, and notes."],
            ].map(([title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <StatusPill tone="blue">{title}</StatusPill>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          title="Availability and rota"
          description="Crew availability and rota views are now available as dedicated subpages."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { href: "/crew/availability", title: "Availability", text: "Record full-day, partial-day, night cover, and weekend unavailability." },
              { href: "/crew/rota", title: "Rota", text: "Review assigned duty periods and capability badges for the selected station." },
              { href: "/crew/cover", title: "Cover", text: "Create cover requests and respond to station open cover requests." },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4 transition hover:border-emerald-400/25 hover:bg-slate-950/70"
              >
                <StatusPill tone="blue">{item.title}</StatusPill>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.text}</p>
              </Link>
            ))}
          </div>
        </SectionShell>
      </div>
    </AppShell>
  );
}
