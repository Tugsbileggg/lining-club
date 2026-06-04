import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";

// Session-dependent — never statically cached.
export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentAdmin();
  if (!user) redirect("/admin/login");

  return (
    <AdminShell user={{ email: user.email, role: user.role }}>
      {children}
    </AdminShell>
  );
}
