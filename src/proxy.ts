import { NextResponse, type NextRequest } from "next/server";

// Lightweight edge guard (Next 16 "proxy" convention): only checks for the
// presence of the session cookie. Full verification + role enforcement happens
// in the admin layout (Node runtime, firebase-admin). Cookie name is duplicated
// here because lib/auth is server-only and cannot be imported into the proxy.
const SESSION_COOKIE = "lc_session";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE));

  if (pathname === "/admin/login") {
    if (hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!hasSession) {
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
