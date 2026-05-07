import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminQualificationsPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Qualifications"
        title="Qualifications"
        summary="Qualifications track currency, expiry, and asset-linked operational permissions."
        routeLabel="Schema: qualification_types + crew_qualifications"
        bullets={[
          "Casualty care must support status and expiry dates.",
          "Qualifications can be attached to an asset, role, or station scope.",
          "The next step is validation screens and expiry-aware status checks.",
        ]}
      />
    </AppShell>
  );
}
