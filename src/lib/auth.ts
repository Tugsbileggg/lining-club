// Server-side admin session helpers (Firebase session cookies + RBAC).
import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { AdminRole } from "@/types";
import { adminAuth } from "./firebase/admin";

export const SESSION_COOKIE = "lc_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days (seconds)

export interface SessionUser {
  uid: string;
  email: string;
  name?: string;
  role: AdminRole;
}

function isRole(v: unknown): v is AdminRole {
  return v === "admin" || v === "staff";
}

/** Verify the session cookie and return the admin/staff user, or null. */
export const getCurrentAdmin = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(token, true);
    if (!isRole(decoded.role)) return null;
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: typeof decoded.name === "string" ? decoded.name : undefined,
      role: decoded.role,
    };
  } catch {
    return null;
  }
});

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === "admin";
}
