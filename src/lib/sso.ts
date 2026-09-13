/**
 * Shared between /api/auth/login and /api/auth/callback - cookie names and
 * env config need to match exactly across both routes, so they live here
 * once rather than being duplicated (and risking a typo divergence) in
 * each route file.
 */

import { createRemoteJWKSet } from "jose";

export const SSO_CODE_VERIFIER_COOKIE = "sso_code_verifier";
export const SSO_STATE_COOKIE = "sso_state";

// Just long enough to complete the redirect round trip to sso-auth's login
// form and back - these cookies have no reason to outlive that. Bumped
// from an original 10 minutes for extra margin on a slow round trip
// (e.g. someone taking a while on sso-auth's login form).
export const SSO_COOKIE_MAX_AGE_SECONDS = 900; // 15 minutes

export interface SsoConfig {
  issuer: string;
  clientId: string;
  redirectUri: string;
}

export function getSsoConfig(): SsoConfig {
  const issuer = process.env.SSO_ISSUER;
  const clientId = process.env.SSO_CLIENT_ID;
  const redirectUri = process.env.SSO_REDIRECT_URI;
  if (!issuer || !clientId || !redirectUri) {
    throw new Error(
      "Missing SSO_ISSUER, SSO_CLIENT_ID, or SSO_REDIRECT_URI. Copy .env.local.example to .env.local and fill in real values."
    );
  }
  return { issuer, clientId, redirectUri };
}

/** Options shared by both short-lived PKCE/state cookies. */
export function ssoTransientCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SSO_COOKIE_MAX_AGE_SECONDS,
  };
}

// ---------------------------------------------------------------------------
// JWKS - memoized per issuer so warm serverless invocations reuse jose's
// own internal fetch cache instead of re-fetching sso-auth's JWKS on every
// callback. Correctness doesn't depend on this (a fresh createRemoteJWKSet
// works fine too), it's purely a minor efficiency win.
// ---------------------------------------------------------------------------

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedIssuer: string | null = null;

export function getSsoJwks(issuer: string) {
  if (!cachedJwks || cachedIssuer !== issuer) {
    cachedJwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", issuer));
    cachedIssuer = issuer;
  }
  return cachedJwks;
}
