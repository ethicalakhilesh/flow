import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Clears Flow's own session cookie and nothing else. Deliberately doesn't
 * call sso-auth at all - Flow's session is independent of sso-auth after
 * login (see the callback route), so logging out of Flow has no reason to
 * involve sso-auth. If sso-auth gets its own logout/session-revocation
 * endpoint later, this would be the place to also call it.
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/api/auth/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
