import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  getSsoConfig,
  getSsoJwks,
  ssoTransientCookieOptions,
  SSO_CODE_VERIFIER_COOKIE,
  SSO_STATE_COOKIE,
} from "@/lib/sso";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const POST_LOGIN_REDIRECT = "/dashboard";

// Explicit even though this route already reads request.cookies/nextUrl
// (which forces dynamic rendering implicitly per Next.js's rules) - after
// the login route's caching bug, "implicitly correct" isn't good enough
// here. This route reads a one-time authorization code; it must never be
// served from a cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Callback failures must not redirect back into the login flow: doing that
 * turns a configuration or provider error into an infinite redirect loop.
 * Keep the detailed reason in server logs and return a bounded response to
 * the browser instead.
 */
function redirectToLogin(request: NextRequest, reason: string) {
  // eslint-disable-next-line no-console
  console.error(`sso-auth callback failed: ${reason}`);
  const response = NextResponse.json(
    { error: "SSO login failed", message: "The authentication callback could not be completed." },
    { status: 400 },
  );
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.cookies.delete(SSO_CODE_VERIFIER_COOKIE);
  response.cookies.delete(SSO_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const { issuer, clientId, redirectUri } = getSsoConfig();
  const params = request.nextUrl.searchParams;

  // sso-auth can redirect back with an error instead of a code (e.g. the
  // user denied consent, or some other failure at its login form).
  const ssoError = params.get("error");
  if (ssoError) {
    return redirectToLogin(request, `sso-auth returned error: ${ssoError}`);
  }

  const code = params.get("code");
  const returnedState = params.get("state");
  if (!code || !returnedState) {
    return redirectToLogin(request, "missing code or state in callback query string");
  }

  const expectedState = request.cookies.get(SSO_STATE_COOKIE)?.value;
  const codeVerifier = request.cookies.get(SSO_CODE_VERIFIER_COOKIE)?.value;
  if (!expectedState || !codeVerifier) {
    return redirectToLogin(request, "missing state/code_verifier cookie - login attempt may have expired");
  }
  // CSRF check - this is the entire reason `state` exists.
  if (returnedState !== expectedState) {
    return redirectToLogin(request, "state mismatch (possible CSRF)");
  }

  // Exchange the code for tokens. code_verifier proves this request came
  // from the same client that started the flow in /api/auth/login -
  // that's what replaces a shared client secret here.
  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(new URL("/api/oidc/token", issuer), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        code_verifier: codeVerifier,
      }),
    });
  } catch (err) {
    return redirectToLogin(request, `token request failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!tokenResponse.ok) {
    const body = await tokenResponse.text().catch(() => "");
    // invalid_grant (expired/reused code, verifier mismatch) and any other
    // token-endpoint error both mean the same thing from here: start over.
    return redirectToLogin(request, `token endpoint returned ${tokenResponse.status}: ${body}`);
  }

  const tokenData = await tokenResponse.json();
  const idToken: unknown = tokenData.id_token;
  if (typeof idToken !== "string") {
    return redirectToLogin(request, "token response had no id_token");
  }

  let sub: string;
  let username: string | undefined;
  try {
    const jwks = getSsoJwks(issuer);
    const acceptedIssuers = issuer.endsWith("/") ? [issuer, issuer.slice(0, -1)] : [issuer, `${issuer}/`];
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: acceptedIssuers,
      audience: clientId,
    });
    if (typeof payload.sub !== "string") {
      return redirectToLogin(request, "id_token had no sub claim");
    }
    sub = payload.sub;
    username = typeof payload.preferred_username === "string" ? payload.preferred_username : undefined;
  } catch (err) {
    return redirectToLogin(request, `id_token verification failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // From here on sso-auth is out of the picture entirely - this is Flow's
  // own session, independent of the ID token's 1-hour lifetime.
  const sessionToken = await createSessionToken({ sub, username });

  const response = NextResponse.redirect(new URL(POST_LOGIN_REDIRECT, request.url));
  response.cookies.set(SESSION_COOKIE, sessionToken, sessionCookieOptions());
  response.cookies.delete(SSO_CODE_VERIFIER_COOKIE);
  response.cookies.delete(SSO_STATE_COOKIE);
  return response;
}
