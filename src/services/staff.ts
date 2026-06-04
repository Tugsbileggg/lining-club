// Staff/role management (server, admin-only). Mirrors the `set-admin` CLI but
// from the admin console: sets the Firebase Auth `role` custom claim AND the
// `admins/{uid}` doc. Users must re-login for a changed claim to take effect.
import "server-only";
import type { Admin, AdminRole } from "@/types";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

const COLLECTION = "admins";

/** Caller-fixable errors (user not found, self-lockout). */
export class StaffError extends Error {}

export async function listStaff(): Promise<Admin[]> {
  const snap = await adminDb().collection(COLLECTION).get();
  const order: Record<AdminRole, number> = { admin: 0, staff: 1 };
  return snap.docs
    .map((d) => d.data() as Admin)
    .sort(
      (a, b) =>
        order[a.role] - order[b.role] || (a.createdAt ?? 0) - (b.createdAt ?? 0),
    );
}

/** Grant (or re-assign) a role to an existing auth user by email. */
export async function grantRoleByEmail(
  email: string,
  role: AdminRole,
): Promise<Admin> {
  let user;
  try {
    user = await adminAuth().getUserByEmail(email);
  } catch {
    throw new StaffError(
      "Энэ и-мэйлтэй хэрэглэгч олдсонгүй. Эхлээд Firebase Console → Authentication дээр үүсгэнэ үү.",
    );
  }
  await adminAuth().setCustomUserClaims(user.uid, { role });

  const existing = await adminDb().collection(COLLECTION).doc(user.uid).get();
  const admin: Admin = {
    uid: user.uid,
    email: user.email ?? email,
    name: user.displayName ?? (existing.data()?.name as string) ?? "",
    role,
    createdAt: (existing.data()?.createdAt as number) ?? Date.now(),
  };
  await adminDb().collection(COLLECTION).doc(user.uid).set(admin);
  return admin;
}

export async function updateRole(uid: string, role: AdminRole): Promise<Admin> {
  const ref = adminDb().collection(COLLECTION).doc(uid);
  const doc = await ref.get();
  if (!doc.exists) throw new StaffError("Ажилтан олдсонгүй.");
  await adminAuth().setCustomUserClaims(uid, { role });
  await ref.update({ role });
  return { ...(doc.data() as Admin), role };
}

export async function revokeAccess(uid: string): Promise<void> {
  // Clears all custom claims (removes `role`) and deletes the admins doc.
  await adminAuth().setCustomUserClaims(uid, null);
  await adminDb().collection(COLLECTION).doc(uid).delete();
}
