import { getCurrentUserContext } from "@/lib/auth";
import { AppShellClient } from "@/components/app-shell-client";

export async function AppShell({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await getCurrentUserContext();

  if (!context.isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <AppShellClient context={context}>
      {children}
    </AppShellClient>
  );
}
