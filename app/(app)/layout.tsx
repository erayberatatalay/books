import { AppShell } from "@/components/layout/AppShell";
import { requireUser } from "@/lib/auth/requireUser";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell fullName={user.profile.full_name} role={user.profile.role}>
      {children}
    </AppShell>
  );
}
