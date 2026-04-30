import { AppShell } from "@/components/layout/app-shell";
import { getCurrentProfile } from "@/lib/auth/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
