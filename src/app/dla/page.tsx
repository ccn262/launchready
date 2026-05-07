import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { SectionShell } from "@/components/section-shell";
import { StatusPill } from "@/components/status-pill";

export default function DlaPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="DLA section"
          title="Station-scoped launch alert and duty cover control"
          summary="DLA users only manage launch alerts and duty cover for their own station. Critical operations are designed to survive unavailable or delayed awareness channels."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <OperationalCard
            title="Duty cover"
            tone="green"
            metric="24 / 7"
            summary="Duty cover can be viewed as a rota, and operational changes can be tracked against station and location scope."
            details={[
              "Day and night cover are separate control views.",
              "Station-level decisions remain isolated from other organisations.",
              "A launch alert can surface asset-specific recovery dependencies.",
            ]}
          />
          <OperationalCard
            title="Alert routing"
            tone="red"
            metric="Resilient"
            summary="Alerting is planned as a layered model: in-app first, email via Resend, then optional SMS and push placeholders. WhatsApp is awareness-only."
            details={[
              "Critical alerts must not depend solely on WhatsApp.",
              "Alert and restoration events need audit logging.",
              "Realtime dashboards will consume these events later.",
            ]}
          />
        </div>

        <SectionShell
          title="Night cover rota placeholder"
          description="Monday to Thursday rota logic is anticipated from the start."
        >
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "Mon night cover",
              "Tue night cover",
              "Wed night cover",
              "Thu night cover",
            ].map((label, index) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <StatusPill tone={index % 2 === 0 ? "green" : "amber"}>
                    Rota
                  </StatusPill>
                  <span className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                    {label}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  This card reserves space for station-aware night cover
                  assignments, handover notes, and alert escalation status.
                </p>
              </div>
            ))}
          </div>
        </SectionShell>
      </div>
    </AppShell>
  );
}
