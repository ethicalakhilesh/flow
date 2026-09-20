import { NextRequest, NextResponse } from "next/server";
import {
  CODE_VERIFIER_COOKIE,
  STATE_COOKIE,
  SESSION_COOKIE,
  exchangeCodeForToken,
  verifyIdToken,
  createSessionToken,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizeUrl,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const expectedState = req.cookies.get(STATE_COOKIE)?.value;
  const codeVerifier = req.cookies.get(CODE_VERIFIER_COOKIE)?.value;
  const redirectUri = `${req.nextUrl.origin}/callback`;

  // Silent renewal failed -> retry visibly (no prompt=none)
  if (error === "login_required") {
    const newVerifier = generateCodeVerifier();
    const newChallenge = await generateCodeChallenge(newVerifier);
    const newState = generateState();
    const res = NextResponse.redirect(
      buildAuthorizeUrl({ redirectUri, codeChallenge: newChallenge, state: newState })
    );
    res.cookies.set(CODE_VERIFIER_COOKIE, newVerifier, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    res.cookies.set(STATE_COOKIE, newState, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (error === "access_denied") {
    const res = new NextResponse(
      "You don't have access to this app yet. Contact an admin.",
      { status: 403 }
    );
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  if (!code || !state || state !== expectedState || !codeVerifier) {
    const res = new NextResponse("Invalid callback", { status: 400 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const idToken = await exchangeCodeForToken({ code, codeVerifier, redirectUri });
  if (!idToken) {
    const res = new NextResponse("Login failed", { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  let payload;
  try {
    payload = await verifyIdToken(idToken);
  } catch {
    const res = new NextResponse("Token verification failed", { status: 401 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  const username = (payload.preferred_username as string) ?? (payload.sub as string);
  const sessionToken = await createSessionToken(username);

  const res = NextResponse.redirect(new URL("/", req.nextUrl.origin));
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  res.cookies.delete(CODE_VERIFIER_COOKIE);
  res.cookies.delete(STATE_COOKIE);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
