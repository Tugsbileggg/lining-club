import { getCurrentAdmin, isAdmin } from "@/lib/auth";
import { getSettings } from "@/services/settings";
import { ComingSoon } from "@/components/admin/coming-soon";
import { SettingsForm } from "@/components/admin/settings-form";
import type { SettingsInput } from "@/lib/validation/settings";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await getCurrentAdmin();
  if (!isAdmin(user)) {
    return (
      <ComingSoon title="Тохиргоо" note="Зөвхөн админ хандах эрхтэй хэсэг." />
    );
  }

  const s = await getSettings();
  const initial: SettingsInput = {
    announcement: s.announcement ?? "",
    shippingText: s.shippingText,
    returnsText: s.returnsText,
    contact: {
      phone: s.contact.phone,
      address: s.contact.address ?? "",
      facebook: s.contact.facebook ?? "",
      instagram: s.contact.instagram ?? "",
    },
  };

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Тохиргоо</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Дэлгүүрийн зарлал, хүргэлт, холбоо барих мэдээлэл.
        </p>
      </div>
      <div className="mt-6">
        <SettingsForm initial={initial} />
      </div>
    </div>
  );
}
