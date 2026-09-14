import { NextResponse } from "next/server";

export const SESSION_COOKIE = "session";
export const SSO_STATE_COOKIE = "sso_state";
export const SSO_CODE_VERIFIER_COOKIE = "sso_code_verifier";

export function getSsoConfig() {
  const rawIssuer = process.env.SSO_ISSUER;
  const clientId = process.env.SSO_CLIENT_ID;
  const redirectUri = process.env.SSO_REDIRECT_URI;

  if (!rawIssuer || !clientId || !redirectUri) {
    throw new Error("Missing SSO configuration");
  }

  const issuer = rawIssuer.replace(/\/+$/, "");

  return {
    issuer,
    clientId,
    redirectUri,
  };
}

export function getTransientCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 15,
  };
}

export function ssoTransientCookieOptions() {
  return getTransientCookieOptions();
}

export function clearSsoCookies(response: NextResponse) {
  response.cookies.delete(SSO_STATE_COOKIE);
  response.cookies.delete(SSO_CODE_VERIFIER_COOKIE);
  return response;
}