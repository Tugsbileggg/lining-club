import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { listStaff } from "@/services/staff";
import { ComingSoon } from "@/components/admin/coming-soon";
import { AddStaffForm } from "@/components/admin/add-staff-form";
import { StaffRowActions } from "@/components/admin/staff-row-actions";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminStaffPage() {
  const user = await getCurrentAdmin();
  if (!isAdmin(user)) {
    return <ComingSoon title="Ажилтан" note="Зөвхөн админ хандах эрхтэй хэсэг." />;
  }

  const staff = await listStaff().catch(() => []);

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ажилтан</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Админ/ажилтны эрх олгох, өөрчлөх, хураах. Хэрэглэгч эрхийн өөрчлөлтийн
          дараа дахин нэвтрэх шаардлагатай.
        </p>
      </div>

      <div className="mt-6">
        <AddStaffForm />
        <p className="mt-2 text-xs text-muted-foreground">
          Хэрэглэгч эхлээд Firebase Authentication дээр бүртгэлтэй байх ёстой.
        </p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Хэрэглэгч</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Эрх</th>
              <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {staff.map((s) => (
              <tr key={s.uid} className="hover:bg-accent/30">
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{s.name || s.email}</span>
                    {s.name && (
                      <span className="text-xs text-muted-foreground">
                        {s.email}
                      </span>
                    )}
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge variant={s.role === "admin" ? "secondary" : "outline"}>
                    {s.role === "admin" ? "Админ" : "Ажилтан"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <StaffRowActions
                    uid={s.uid}
                    role={s.role}
                    isSelf={s.uid === user?.uid}
                  />
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Бүртгэлтэй ажилтан алга.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
