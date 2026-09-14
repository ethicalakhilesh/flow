import Image from "next/image";

/**
 * Reached two ways: middleware redirects here for any unauthenticated page
 * visit, and /api/auth/logout redirects here after clearing the session.
 * Deliberately NOT an auto-redirect straight into sso-auth - bouncing a
 * user through a third-party login with no page of their own in between
 * (especially right after they just clicked "Log out") is disorienting.
 * The actual OIDC flow only starts once they click the button below.
 *
 * force-dynamic here for the same reason it's on the auth routes: this
 * page has no dynamic API usage of its own (no cookies()/headers()/
 * searchParams), which is exactly the shape Next.js's App Router
 * statically prerenders and caches by default. That's the precise bug
 * class that caused the earlier "missing state/code_verifier cookie"
 * incident on /api/auth/login - closing the same gap here defensively,
 * even without a confirmed mechanism connecting it to the redirect loop.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoggedOutPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Image src="/icons/icon.svg" alt="" width={64} height={64} className="mb-5 rounded-[22%]" />
      <h1 className="mb-1 font-display text-xl font-bold text-ink">You're logged out</h1>
      <p className="mb-6 max-w-xs text-sm text-muted">
        Sign in to see your accounts, transactions, and budgets.
      </p>
      <a
        href="/api/auth/login"
        className="rounded-xl2 bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card"
      >
        Log In
      </a>
    </div>
  );
}
