import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminMinimumCrewingPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Minimum crewing"
        title="Minimum crewing"
        summary="Minimum crewing captures the operational baseline for each asset or asset type."
        routeLabel="Schema: asset_minimum_crewing"
        bullets={[
          "Minimum crewing is station-scoped and asset-aware.",
          "Launch authority and recovery dependencies can be expressed here.",
          "The next step is calculator logic for readiness and shortage highlighting.",
        ]}
      />
    </AppShell>
  );
}
