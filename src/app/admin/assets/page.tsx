import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminAssetsPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Assets"
        title="Assets"
        summary="Assets cover lifeboats and launch/recovery equipment, with status and location scope."
        routeLabel="Schema: asset_types + assets"
        bullets={[
          "Asset types are global reference data; assets belong to a station and location.",
          "Launch and recovery equipment such as winches and davits are first-class operational assets.",
          "The next step is asset CRUD with status, recovery support, and audit logging.",
        ]}
      />
    </AppShell>
  );
}
