// Store settings service (server). Single doc `settings/store`. Read is used by
// the storefront (announcement bar, footer) and admin; write is admin-only.
import "server-only";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import type { Settings } from "@/types";
import { adminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { siteConfig } from "@/config/site";
import type { SettingsInput } from "@/lib/validation/settings";

const DOC = "store";

/** Fallback used before Firestore is configured / the doc is seeded. */
export const DEFAULT_SETTINGS: Settings = {
  shippingText:
    "Улаанбаатар хотод 1-2 хоногт хүргэнэ. Орон нутагт унаанд тавьж илгээнэ.",
  returnsText: "24 цагийн дотор солих боломжтой.",
  contact: {
    phone: siteConfig.contact.phone,
    address: siteConfig.contact.address,
  },
  banners: [],
};

/** Deduped per-request read. Merges the stored doc over defaults. */
export const getSettings = cache(async (): Promise<Settings> => {
  if (!isAdminConfigured()) return DEFAULT_SETTINGS;
  try {
    const doc = await adminDb().collection("settings").doc(DOC).get();
    if (!doc.exists) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(doc.data() as Partial<Settings>) };
  } catch (err) {
    console.error("[settings] read failed, using defaults:", err);
    return DEFAULT_SETTINGS;
  }
});

/**
 * Persist the admin-managed fields. `merge: true` leaves untouched keys
 * (e.g. `banners`, managed elsewhere) intact.
 */
export async function updateSettings(input: SettingsInput): Promise<Settings> {
  const ref = adminDb().collection("settings").doc(DOC);
  await ref.set(input, { merge: true });
  // Footer + announcement bar live in the storefront layout.
  revalidatePath("/", "layout");
  const doc = await ref.get();
  return { ...DEFAULT_SETTINGS, ...(doc.data() as Partial<Settings>) };
}
