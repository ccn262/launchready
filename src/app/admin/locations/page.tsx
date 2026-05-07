import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminLocationsPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Locations"
        title="Locations"
        summary="Station locations hold the inshore and offshore operational layout, including the Southend reference model."
        routeLabel="Schema: station_locations"
        bullets={[
          "Locations sit beneath a station and order the assets available at each site.",
          "Southend uses Inshore Station and Offshore / Pier Station as the reference pattern.",
          "The next step is station-scoped editing and asset placement.",
        ]}
      />
    </AppShell>
  );
}
