import { AppShell } from "@/components/app-shell";
import { AdminPlaceholderPage } from "@/components/admin-placeholder-page";

export default function AdminRolesPage() {
  return (
    <AppShell>
      <AdminPlaceholderPage
        eyebrow="Admin / Roles"
        title="Roles"
        summary="Operational roles are per asset, not global, and are currency-aware."
        routeLabel="Schema: operational_roles + asset_role_qualifications"
        bullets={[
          "A crew member can hold different roles on different assets.",
          "Currency must support green, amber, and red states.",
          "The next step is role assignment and per-asset qualification screens.",
        ]}
      />
    </AppShell>
  );
}
