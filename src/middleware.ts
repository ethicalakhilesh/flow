import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";

/**
 * Routes that must stay reachable with no session at all - the auth flow
 * itself (can't require a session to go log in), plus static assets the
 * browser may probe independently of any rendered page.
 */
const PUBLIC_PATHS = [
  "/logged-out",
  "/api/auth/login",
  "/api/auth/callback",
  "/api/auth/logout",
  "/manifest.json",
  "/icons",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    // API routes get a 401 they can handle in JS, not a redirect. A
    // client-side fetch() that gets redirected to sso-auth's hosted login
    // page would follow it, get back HTML, and then fail confusingly on
    // res.json() - a clean 401 lets calling code detect "logged out" and
    // react properly instead.
    if (pathname.startsWith("/api/")) {
      const res = NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      return res;
    }
    const res = NextResponse.redirect(new URL("/logged-out", request.url));
    // Same defense-in-depth as the auth routes' explicit Cache-Control -
    // middleware's own redirects never had this before. A cached redirect
    // response served to the wrong session/user at the edge is one more
    // way to end up in a loop that a single file's code can't explain.
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }

  // Forward the verified identity to Server Components via request headers
  // (readable with next/headers' headers()) - not response headers, which
  // go to the browser but never reach the Server Component tree for this
  // same request. Nothing reads these yet, but it's there for whenever a
  // page wants to show who's logged in without re-verifying the cookie itself.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-flow-user-sub", session.sub);
  if (session.username) requestHeaders.set("x-flow-user-username", session.username);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  // Everything except Next's own static/image internals and favicon -
  // this deliberately includes every page AND every /api/* route, not
  // just rendered pages, since an unauthenticated write to e.g.
  // /api/transactions is just as much a gap as an unauthenticated page view.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
