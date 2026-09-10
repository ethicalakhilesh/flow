/**
 * Flow's own session, set once by /api/auth/callback after verifying an
 * sso-auth ID token, and checked on every subsequent request without
 * talking to sso-auth again. Deliberately longer-lived than sso-auth's
 * 1-hour ID token (which has no refresh flow yet - that's Phase 5) - Flow
 * only needs to verify the original ID token once, at login time.
 */

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "flow_session";

// 30 days, "remember me"-style - reasonable default for a personal,
// single-user app. Revisit if this app ever needs a shorter, stricter
// session lifetime.
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionClaims {
  sub: string;
  username?: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.FLOW_SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "Missing FLOW_SESSION_SECRET. Copy .env.local.example to .env.local and fill in real values."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(claims: SessionClaims): Promise<string> {
  return await new SignJWT({ sub: claims.sub, username: claims.username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/**
 * Returns the session claims if the cookie is a valid, unexpired,
 * correctly-signed Flow session - null for anything else (missing,
 * tampered, expired, wrong signature). Never throws on bad input, so
 * callers (middleware, etc.) can treat null as "not logged in" uniformly.
 */
export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.sub !== "string") return null;
    return {
      sub: payload.sub,
      username: typeof payload.username === "string" ? payload.username : undefined,
    };
  } catch {
    // Covers: bad signature (tampered), expired, malformed - all "not logged in".
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}
