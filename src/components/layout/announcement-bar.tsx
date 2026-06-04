import { getSettings } from "@/services/settings";

// Thin promo bar above the header. Hidden when no announcement is set.
export async function AnnouncementBar() {
  const { announcement } = await getSettings();
  if (!announcement?.trim()) return null;

  return (
    <div className="bg-foreground text-background">
      <div className="container-page py-2 text-center text-xs font-medium tracking-wide">
        {announcement}
      </div>
    </div>
  );
}
