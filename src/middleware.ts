import { NextRequest, NextResponse } from "next/server";
import {
  CODE_VERIFIER_COOKIE,
  STATE_COOKIE,
  SESSION_COOKIE,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizeUrl,
  verifySessionToken,
} from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let the callback route handle itself
  if (pathname.startsWith("/callback")) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const session = sessionCookie ? await verifySessionToken(sessionCookie) : null;

  if (session) {
    const res = NextResponse.next();
    res.headers.set("x-flow-user-username", session.username);
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  // "/" is public — render the logged-out landing page instead of
  // auto-bouncing to sso-auth. Every other route stays protected.
  if (pathname === "/") {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "no-store, must-revalidate");
    return res;
  }

  // Not logged in — kick off PKCE flow
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  const redirectUri = `${req.nextUrl.origin}/callback`;
  const authorizeUrl = buildAuthorizeUrl({ redirectUri, codeChallenge, state });

  const res = NextResponse.redirect(authorizeUrl);
  // Every request must generate a fresh state/code_verifier pair and set
  // fresh cookies. If this redirect gets cached, later requests replay a
  // stale response whose Set-Cookie no longer matches the state param
  // sso-auth sends back — causing "missing state/code_verifier cookie" on
  // every callback. Same bug class documented for the old Flow build.
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  res.cookies.set(CODE_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  res.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
