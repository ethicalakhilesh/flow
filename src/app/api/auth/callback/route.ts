import { NextRequest, NextResponse } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import {
  getSsoConfig,
  getTransientCookieOptions,
  SESSION_COOKIE,
  SSO_CODE_VERIFIER_COOKIE,
  SSO_STATE_COOKIE,
} from "@/lib/sso";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const response = NextResponse.redirect(
    new URL("/logged-out", req.url)
  );

  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  if (error) {
    console.error("sso-auth callback returned error:", error);
    return response;
  }

  if (!code || !state) {
    console.error("sso-auth callback missing code/state");
    return response;
  }

  const expectedState = req.cookies.get(SSO_STATE_COOKIE)?.value;
  const codeVerifier = req.cookies.get(SSO_CODE_VERIFIER_COOKIE)?.value;

  if (!expectedState || !codeVerifier || state !== expectedState) {
    console.error(
      "sso-auth callback state/code_verifier validation failed"
    );
    return response;
  }

  const config = getSsoConfig();

  try {
    const tokenResponse = await fetch(
      `${config.issuer}/api/oidc/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: config.redirectUri,
          client_id: config.clientId,
          code_verifier: codeVerifier,
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "sso-auth token exchange failed:",
        tokenResponse.status,
        await tokenResponse.text()
      );
      return response;
    }

    const tokens = await tokenResponse.json();
    const idToken = tokens.id_token;

    if (!idToken) {
      console.error("sso-auth token response missing id_token");
      return response;
    }

    const jwks = createRemoteJWKSet(
      new URL(`${config.issuer}/.well-known/jwks.json`)
    );

    const { payload } = await jwtVerify(idToken, jwks, {
      issuer: config.issuer,
      audience: config.clientId,
    });

    const sessionResponse = NextResponse.redirect(
      new URL("/dashboard", req.url)
    );

    sessionResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );
    sessionResponse.headers.set("Pragma", "no-cache");
    sessionResponse.headers.set("Expires", "0");

    sessionResponse.cookies.set(
      SESSION_COOKIE,
      JSON.stringify({
        sub: payload.sub,
        email: payload.email,
        name: payload.name,
      }),
      {
        ...getTransientCookieOptions(),
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    sessionResponse.cookies.delete(SSO_STATE_COOKIE);
    sessionResponse.cookies.delete(SSO_CODE_VERIFIER_COOKIE);

    return sessionResponse;
  } catch (err) {
    console.error(
      "sso-auth callback failed:",
      err instanceof Error ? err.message : err
    );

    return response;
  }
}