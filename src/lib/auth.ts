import { SignJWT, jwtVerify, createRemoteJWKSet } from "jose";

export const SSO_ISSUER = process.env.SSO_ISSUER!;
export const SSO_CLIENT_ID = process.env.SSO_CLIENT_ID!;

const SESSION_SECRET = new TextEncoder().encode(
  process.env.FLOW_SESSION_SECRET!
);

export const CODE_VERIFIER_COOKIE = "flow_code_verifier";
export const STATE_COOKIE = "flow_state";
export const SESSION_COOKIE = "flow_session";

// Edge Runtime (middleware) has no Node `crypto` module — use Web Crypto,
// which works in both Edge and Node.
function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomBase64Url(byteLength: number) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export function generateCodeVerifier() {
  return randomBase64Url(32);
}

export async function generateCodeChallenge(verifier: string) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

export function generateState() {
  return randomBase64Url(16);
}

export function buildAuthorizeUrl({
  redirectUri,
  codeChallenge,
  state,
  silent = false,
}: {
  redirectUri: string;
  codeChallenge: string;
  state: string;
  silent?: boolean;
}) {
  const url = new URL("/authorize", SSO_ISSUER);
  url.searchParams.set("client_id", SSO_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  if (silent) url.searchParams.set("prompt", "none");
  return url.toString();
}

export async function exchangeCodeForToken({
  code,
  codeVerifier,
  redirectUri,
}: {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}) {
  const res = await fetch(`${SSO_ISSUER}/api/oidc/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: SSO_CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) return null;
  const { id_token } = await res.json();
  return id_token as string;
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJWKS() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`${SSO_ISSUER}/.well-known/jwks.json`));
  }
  return jwks;
}

export async function verifyIdToken(idToken: string) {
  const { payload } = await jwtVerify(idToken, getJWKS(), {
    issuer: SSO_ISSUER,
    audience: SSO_CLIENT_ID,
  });
  return payload;
}

// Flow's own session token (separate from the SSO ID token)
export async function createSessionToken(username: string) {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    return payload as { username: string };
  } catch {
    return null;
  }
}
