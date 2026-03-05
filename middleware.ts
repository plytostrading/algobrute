/**
 * Next.js middleware — route-level auth guard.
 *
 * Checks for the lightweight `logged_in` cookie that the backend sets
 * alongside the httpOnly refresh_token cookie on every auth action.
 * Unauthenticated users are redirected to /login.
 *
 * The actual token validity is enforced on the backend; this cookie is only
 * a UI convenience to avoid showing the dashboard to logged-out users.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Paths that do NOT require authentication. */
const PUBLIC_PATHS = ["/login"];

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Never gate Next.js internals (HMR, chunks, etc.)
  if (pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // Always allow public paths through.
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for the session indicator cookie (non-httpOnly, set by the backend).
  const loggedIn = request.cookies.get("logged_in")?.value;
  if (loggedIn !== "true") {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - /public       (public assets)
     * - /auth/*       (proxied to backend — must NOT be gated by middleware)
     * - /api/*        (proxied to backend — must NOT be gated by middleware)
     */
    "/((?!_next|favicon.ico|public|auth|api).*)",
  ],
};

