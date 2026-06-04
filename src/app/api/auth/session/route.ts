import { NextResponse, type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export const runtime = "nodejs";

// Exchange a Firebase ID token for an httpOnly session cookie, after checking
// the user holds an admin/staff role claim.
export async function POST(req: NextRequest) {
  let idToken: unknown;
  try {
    ({ idToken } = await req.json());
  } catch {
    return NextResponse.json({ error: "Буруу хүсэлт" }, { status: 400 });
  }
  if (typeof idToken !== "string") {
    return NextResponse.json({ error: "Токен дутуу" }, { status: 400 });
  }

  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (decoded.role !== "admin" && decoded.role !== "staff") {
      return NextResponse.json(
        { error: "Танд админ/ажилтны эрх алга." },
        { status: 403 },
      );
    }
    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });
    const res = NextResponse.json({ ok: true, role: decoded.role });
    res.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ error: "Нэвтрэлт амжилтгүй." }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
