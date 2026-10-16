import ProtectedShell from "@/components/layout/ProtectedShell";
import { getServerRole } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getServerRole();
  return <ProtectedShell initialRole={role}>{children}</ProtectedShell>;
}
