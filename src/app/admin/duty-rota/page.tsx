import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminDutyRotaPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Duty rota"
        title="Duty rota"
        summary="Duty rota planning coordinates night cover, incident cover, and launch-alert readiness."
        routeLabel="Schema: duty_periods + incidents"
        bullets={[
          "DLA users should only manage incidents and alerts for their own station.",
          "Rota logic needs to handle Monday to Thursday night cover cleanly.",
          "The next step is generating rota views from availability and duty periods.",
        ]}
      />
    </AppShell>
  );
}
