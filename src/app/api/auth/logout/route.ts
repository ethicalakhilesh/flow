import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Same reasoning as the login route: a cached logout response could serve
// a stale redirect with no actual cookie-clearing Set-Cookie to a
// different user. Must run fresh every time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Clears Flow's own session cookie and nothing else. Deliberately doesn't
 * call sso-auth at all - Flow's session is independent of sso-auth after
 * login (see the callback route), so logging out of Flow has no reason to
 * involve sso-auth. If sso-auth gets its own logout/session-revocation
 * endpoint later, this would be the place to also call it.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/logged-out", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
