import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminStationsPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Stations"
        title="Stations"
        summary="Station records define the organisation boundary for management, crew access, and launch control."
        routeLabel="Schema: stations"
        bullets={[
          "One organisation can own many stations.",
          "Station admins and LOMs must stay scoped to their own organisation and station.",
          "The next step is CRUD backed by RLS-protected station queries.",
        ]}
      />
    </AppShell>
  );
}
