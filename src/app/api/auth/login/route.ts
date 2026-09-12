import { NextResponse } from "next/server";
import crypto from "crypto";
import {
  getSsoConfig,
  ssoTransientCookieOptions,
  SSO_CODE_VERIFIER_COOKIE,
  SSO_STATE_COOKIE,
} from "@/lib/sso";

// CRITICAL: this route generates a fresh secret (code_verifier) and a
// fresh CSRF token (state) on every single request, and MUST run fresh
// every time. Without these two lines, Next.js's default heuristic for App
// Router Route Handlers treats a GET handler with no dynamic API usage
// (no NextRequest param, no cookies()/headers() call) as STATIC and
// CACHEABLE - meaning it can be built/cached once and then serve the same
// baked-in code_verifier/state/Set-Cookie to every visitor thereafter, or
// have its Set-Cookie header silently stripped by a CDN on a cache HIT.
// This is exactly what produced the "missing state/code_verifier cookie"
// failures in the callback route - confirmed by `/login` showing
// `cache=HIT` in production logs.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const { issuer, clientId, redirectUri } = getSsoConfig();

  // PKCE: code_verifier is a random string only this server ever sees in
  // plaintext. code_challenge is its SHA-256 hash, sent to sso-auth now.
  // sso-auth stores the challenge and, in the callback step, won't hand
  // back a token unless we present the matching verifier - this is what
  // replaces a shared client secret for a public client like Flow.
  // 32 random bytes -> 43-char base64url string, within PKCE's required
  // 43-128 character range (RFC 7636).
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // CSRF protection: sso-auth echoes this back in the callback, which
  // rejects the request outright if it doesn't match this cookie.
  const state = crypto.randomBytes(16).toString("base64url");

  const authorizeUrl = new URL("/authorize", issuer);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  // Not explicitly listed in the integration plan's parameter list, but
  // OIDC spec requires "openid" in scope for the response to include an
  // ID token at all - included defensively. Remove if sso-auth's /authorize
  // rejects an unrecognized scope param.
  authorizeUrl.searchParams.set("scope", "openid");
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());

  // Defense in depth on top of dynamic/revalidate above: explicitly tell
  // any CDN/proxy sitting in front of this not to cache this response
  // under any circumstances, so a misconfigured edge cache can't
  // reintroduce this exact bug independently of Next.js's own behavior.
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");

  const cookieOptions = ssoTransientCookieOptions();
  response.cookies.set(SSO_CODE_VERIFIER_COOKIE, codeVerifier, cookieOptions);
  response.cookies.set(SSO_STATE_COOKIE, state, cookieOptions);

  return response;
}
