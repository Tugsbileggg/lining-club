import { NextResponse, type NextRequest } from "next/server";

// Lightweight edge guard (Next 16 "proxy" convention): only checks for the
// presence of the session cookie. Full verification + role enforcement happens
// in the admin layout (Node runtime, firebase-admin). Cookie name is duplicated
// here because lib/auth is server-only and cannot be imported into the proxy.
const SESSION_COOKIE = "lc_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page must always be reachable. This guard only sees whether a
  // cookie exists, not whether it is still valid, so bouncing a cookie holder
  // to /admin would loop forever against the protected layout: that layout
  // redirects back here whenever it rejects the session (expired cookie, or a
  // user whose role claim was revoked or never granted).
  if (pathname === "/admin/login") return NextResponse.next();

  if (!req.cookies.get(SESSION_COOKIE)) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
