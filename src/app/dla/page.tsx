import { AppShell } from "@/components/app-shell";
import { OperationalCard } from "@/components/operational-card";
import { PageHero } from "@/components/page-hero";
import { ReadinessBoard } from "@/components/readiness-board";
import { loadReadinessSnapshot } from "@/lib/readiness";

export default async function DlaPage() {
  const snapshot = await loadReadinessSnapshot({
    pathname: "/dla",
    requestedStationId: null,
    operationType: "service",
    windowPreset: "current",
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHero
          eyebrow="DLA section"
          title="Station readiness and duty cover control"
          summary="DLA users can view station readiness, missing roles, and duty context for their own station without touching launch authorisation."
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <OperationalCard
            title="Readiness visibility"
            tone="green"
            metric="Station scope"
            summary="The readiness engine highlights missing hard-stop roles, qualified crew counts, and launch/recovery dependencies."
            details={[
              "Readiness is calculated per asset and then rolled up to the station.",
              "Crew availability and duty periods are part of the calculation.",
              "The output is advisory, not a launch authority.",
            ]}
          />
          <OperationalCard
            title="Operational boundaries"
            tone="amber"
            metric="Decision support only"
            summary="If a hard-stop role is missing, the asset will not be shown as launch-ready."
            details={[
              "Dynamic risk assessment may be recorded later.",
              "WhatsApp and SMS remain out of scope here.",
              "Launch initiation is not part of this phase.",
            ]}
          />
        </div>

        <ReadinessBoard snapshot={snapshot} />
      </div>
    </AppShell>
  );
}
