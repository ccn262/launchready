import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminCrewPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Crew"
        title="Crew"
        summary="Crew records are private by default and become station-visible only where policy allows."
        routeLabel="Schema: profiles + station_memberships"
        bullets={[
          "Profiles are tied to auth.users and auto-created from the auth trigger.",
          "Station memberships define who can see or manage a station.",
          "The next step is crew management with RLS-aware data access.",
        ]}
      />
    </AppShell>
  );
}
