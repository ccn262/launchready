import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";

export default function AdminPage() {
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
          description="This section reserves room for station configuration, notifications, and audit review."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              "Manage organisations and stations",
              "Configure locations and assets",
              "Review operational audit history",
            ].map((label, index) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <StatusPill tone={index === 1 ? "amber" : "green"}>
                  Control
                </StatusPill>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </SectionShell>
      </div>
    </AppShell>
  );
}
