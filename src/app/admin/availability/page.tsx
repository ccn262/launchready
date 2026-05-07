import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminAvailabilityPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Availability"
        title="Availability"
        summary="Availability blocks support day cover, split cover, and night cover including Monday to Thursday rota patterns."
        routeLabel="Schema: availability_slots"
        bullets={[
          "Crew can declare full-day, partial-day, and night cover windows.",
          "Availability is station-scoped and should remain private by default.",
          "The next step is calendar rendering and rota calculation.",
        ]}
      />
    </AppShell>
  );
}
