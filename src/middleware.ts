import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LEGACY_SESSION_COOKIE,
  SESSION_COOKIE,
  verifySessionToken,
} from "@server/auth/session-token";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const legacy = request.cookies.get(LEGACY_SESSION_COOKIE)?.value;

  const isPublic =
    pathname === "/login" ||
    pathname === "/privacy" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/bg") ||
    pathname === "/favicon.ico";

  const payload = token ? await verifySessionToken(token) : null;
  const authed = Boolean(payload);

  const withCleanup = (res: NextResponse) => {
    if (legacy) res.cookies.delete(LEGACY_SESSION_COOKIE);
    if (token && !payload) res.cookies.delete(SESSION_COOKIE);
    return res;
  };

  if (!authed && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return withCleanup(NextResponse.redirect(url));
  }

  if (authed && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return withCleanup(NextResponse.redirect(url));
  }

  return withCleanup(NextResponse.next());
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|brand|bg|favicon.ico).*)"],
};
