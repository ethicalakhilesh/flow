# Flow — Personal Finance (V1: Manual Entry)

A personal finance tracker: dashboard, transactions, accounts, manual entry.
Runs on Next.js, deploys to Vercel, backed by Airtable.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard`.

## What's in V1

- **Dashboard**: total balance, income, expenses, remaining, spending trend, category breakdown, recent transactions, accounts summary
- **Add Transaction**: expense/income toggle, numeric keypad, category, account, date, note
- **Transactions**: searchable, filterable list (all / income / expense)
- **Accounts**: total net position (assets vs. liabilities, hide/show toggle), grouped Bank Accounts / Credit Cards lists with real bank icons and masked numbers, per-account detail pages with a transaction history, and a full Add Account flow (Bank/Credit Card/Cash/Wallet)
- **Memberships**: airline miles, hotel points, and other loyalty programs — grouped by category, with an expiry warning banner for anything expiring within 90 days
- **Budget**: per-category spending limits with day/week/month recurrence and effective-dated amendments (editing a recurring budget never rewrites its history — see the "Budget" section below)
- **PWA**: installable via `public/manifest.json`, icon sourced entirely from `public/icons/icon.svg` — one file, referenced everywhere (manifest, favicon, apple touch icon, sidebar logo). Swap that single file to rebrand.

## Authentication

Flow authenticates against **sso-auth**, a separate, independently-deployed
OIDC identity provider (its own Next.js project, own Airtable base) — not
something built inside this repo. Flow is one of its client applications.
This section documents what Flow's own code actually does, verified against
the real route files rather than against the original integration plan
(which had a couple of inaccuracies the actual sso-auth source corrected —
see "Corrections vs. the original plan" below). **Caveat**: sso-auth has
since shipped several more phases on its own side (discovery/JWKS endpoints,
a client registry, silent renewal via `prompt=none`, a client-management
dashboard) that were built after Flow's integration and that this doc was
never re-verified against. If sso-auth's `/authorize` or token endpoint
behavior has changed since, treat anything below describing *sso-auth's*
side as possibly stale — everything describing *Flow's* own code is current.

### Env vars

`SSO_ISSUER`, `SSO_CLIENT_ID`, `SSO_REDIRECT_URI`, `FLOW_SESSION_SECRET` —
see `.env.local.example`. No client secret: PKCE plus sso-auth's public JWKS
replace that entirely for a public client like Flow.

### The flow, step by step

1. **Unauthenticated visit.** `src/middleware.ts` checks the `flow_session`
   cookie on every request (pages and `/api/*` alike, except the auth
   routes and static assets — see its `PUBLIC_PATHS`). No valid session:
   pages redirect to `/logged-out`; `/api/*` routes get a `401` JSON body
   instead, so a `fetch()` call can detect "logged out" and react, rather
   than following a redirect into an HTML login page and failing
   confusingly on `res.json()`.
2. **`/logged-out`.** A real page with a "Log In" button — deliberately
   *not* an automatic bounce into sso-auth. Reached both from middleware
   and from `/api/auth/logout`; landing here right after clicking "log out"
   is the case that most needed a stop, not an instant re-login.
3. **`GET /api/auth/login`** (triggered by that button). Generates a PKCE
   `code_verifier` (32 random bytes, base64url) and its SHA-256
   `code_challenge`, plus a CSRF `state`, stores both `code_verifier` and
   `state` in short-lived (15 min) httpOnly cookies, then redirects to
   `${SSO_ISSUER}/authorize` with `client_id`, `redirect_uri`,
   `response_type=code`, `code_challenge`, `code_challenge_method=S256`,
   `scope=openid`, and `state`.
4. **sso-auth's own login form** (a different origin entirely — Flow has
   no visibility into or control over what happens here). Confirmed against
   its source at integration time: `/authorize` is itself gated by
   sso-auth's *own* middleware, which redirects to sso-auth's `/login` page
   if there's no session on sso-auth's own domain, then back to
   `/authorize` once there is one.
5. **`GET /api/auth/callback`** (`SSO_REDIRECT_URI` must point here,
   character-for-character matching an entry in sso-auth's `Clients` table —
   this match is a strict `.includes()`, not normalized). Validates `state`
   against the cookie; any mismatch or missing cookie redirects back to
   `/logged-out` rather than dead-ending. Exchanges `code` for tokens at
   `${SSO_ISSUER}/api/oidc/token` (`application/x-www-form-urlencoded`;
   confirmed the real endpoint also accepts JSON, but form-urlencoded is
   what Flow sends). Verifies the returned `id_token`'s signature and
   `issuer`/`audience` claims against sso-auth's JWKS
   (`src/lib/sso.ts`'s `getSsoJwks`, fetched from
   `${SSO_ISSUER}/.well-known/jwks.json`, memoized per-issuer). Reads
   `sub` and `preferred_username` from the verified payload — confirmed
   these are exactly the two claims sso-auth's `signIdToken` sets.
6. **Flow's own session.** On success, callback mints Flow's *own* session
   (next section) and redirects to `/dashboard`. sso-auth is not contacted
   again after this point for the lifetime of that session — middleware's
   authenticated path only ever calls `verifySessionToken` locally, no
   network call, no re-visiting sso-auth on every request.
7. **Logout.** `GET /api/auth/logout` clears only the `flow_session`
   cookie and redirects to `/logged-out`. It deliberately never calls
   sso-auth — Flow's session is independent of sso-auth's after step 6, so
   there's nothing on sso-auth's side that logging out of Flow needs to
   touch.

### Flow's own session

`src/lib/session.ts` — a signed HS256 JWT (via `jose`) in an httpOnly
`flow_session` cookie, 30-day lifetime. Deliberately independent of and
longer-lived than sso-auth's 1-hour ID token: Flow only verifies that ID
token once, at login time, and never needs to re-verify or refresh it
afterward. `verifySessionToken` returns `null` for anything invalid —
wrong signature (tampered), expired, or malformed — so every caller treats
those cases identically as "not logged in."

### The caching bug (fixed, but the underlying rule matters everywhere)

`/api/auth/login` was getting cached by Next.js's App Router — confirmed
via `cache=HIT` in production logs — silently serving the *same* baked-in
`code_verifier`/`state`/`Set-Cookie` to every visitor instead of generating
fresh ones per request. That's exactly what produced "missing
state/code_verifier cookie" failures downstream in the callback route.

**Root cause**: a GET Route Handler (or a page) with no dynamic API usage
— no `NextRequest` param, no `cookies()`/`headers()`/`searchParams` call —
is treated by Next.js's App Router as static and cacheable *by default*.
This is a general rule, not specific to this one route: **any route that
mints a per-request secret, nonce, or random state needs `export const
dynamic = "force-dynamic"` and `export const revalidate = 0`, or it can
serve stale baked-in values in production.** Applied to all three auth
routes, plus `/logged-out` and `/settings` once those existed (same shape,
same risk, even though they don't mint secrets themselves). The login
route also sets an explicit `Cache-Control: no-store` header, and
middleware's own redirect/401 responses do too, as defense-in-depth against
a misconfigured CDN/edge cache reintroducing the same bug independently of
Next.js's own caching behavior.

### Corrections vs. the original integration plan

Cross-checked against sso-auth's actual source at integration time (not
just the plan doc), two things worth knowing:
- The plan's parameter list for `/authorize` didn't include `scope`. OIDC
  spec requires `scope=openid` for the response to include an ID token at
  all, so Flow sends it — confirmed sso-auth's `/authorize` doesn't
  currently read or enforce `scope` either way, so this is a safe no-op
  addition, not a conflict.
- The plan didn't specify the token endpoint's request encoding. Confirmed
  sso-auth's real token route branches on `Content-Type` and accepts both
  JSON and `application/x-www-form-urlencoded` — Flow sends the latter.

### Known open issue

An `ERR_TOO_MANY_REDIRECTS` loop was reported after the deploy that added
`/logged-out`, the mobile profile menu, and the design pass. Static code
review (tracing `middleware.ts`'s `PUBLIC_PATHS`, the matcher's exclusions,
every redirect target) did not turn up a certain mechanism for an actual
loop. Applied the same "force-dynamic + no-store" treatment to `/logged-out`
and `/settings` and to middleware's own redirect responses as a defensible,
zero-risk precaution — but this was **not** confirmed as the root cause,
only as closing the same category of gap that caused the earlier confirmed
bug. If it recurs, the actual redirect chain (browser DevTools Network tab,
"Preserve log" on, or Vercel's logs) is the only way to pin down which
specific URLs it's bouncing between — that evidence is still outstanding.

### Test checklist status

- [x] **Tampering with the session cookie is rejected** — by construction:
  `verifySessionToken` wraps `jwtVerify` in a try/catch returning `null` on
  any failure, and HMAC verification rejects any single-byte change to a
  signed JWT. Pure JWT logic, no network call needed to verify this one.
- [x] **Refresh doesn't trigger another sso-auth round trip** — confirmed
  by reading `middleware.ts`: the authenticated path never references
  `SSO_ISSUER` or calls `fetch()`.
- [x] **Logout clears Flow's session without touching sso-auth** — confirmed
  by reading the route: no call to sso-auth anywhere in it.
- [ ] **The full logged-out → sso-auth login form → back into Flow round
  trip** — depends on sso-auth's real endpoints behaving as documented,
  which can't be verified without a live deployment and real credentials.
  Needs to be clicked through after each deploy that touches auth.


## Roadmap

What's done vs. what's still ahead, organized by area of a typical personal
finance app. Checked items link to more detail further down this file where
relevant.

**Core tracking**
- [x] Multiple account types (bank, cash, wallet, credit card)
- [x] Income/expense/transfer transactions, categorized
- [x] Manual entry
- [ ] Automated import (bank statement/email/SMS parsing — this is what the
      separate Python statement-parser project feeds into)
- [ ] Auto-categorization rules (e.g. "Swiggy → Food & Dining" automatically)
- [ ] Recurring transaction templates (auto-log rent every 1st, etc.)

**Budgeting**
- [x] Per-category budgets, day/week/month recurrence, effective-dated amendments
- [ ] Budget rollover (unused amount carries to next period)
- [ ] Envelope-style budgeting (allocate income across categories upfront)

**Net worth**
- [x] Assets vs. liabilities, total net position
- [ ] Net worth trend over time (a chart, not just the current snapshot)
- [ ] Multi-currency support

**Credit cards**
- [x] Statement/due dates, utilization, add-on cards with shared/separate limits
- [ ] Minimum payment tracking, interest/APR tracking
- [ ] Cashback/reward tracking tied to spend (separate from loyalty points)

**Bills & subscriptions**
- [ ] Recurring bill detection + reminders
- [ ] Subscription cost rollup ("₹2,400/month across 6 subscriptions")
- [ ] Calendar view of upcoming payments

**Goals**
- [ ] Savings goals with target date + progress
- [ ] Debt payoff goals (snowball/avalanche tracking)

**Insights & analytics**
- [x] Category breakdown, spending trend chart, month selector
- [ ] Month-over-month / year-over-year comparison
- [ ] Merchant-level insights ("top 5 merchants this year")
- [ ] Anomaly flags ("40% more on dining than usual")
- [ ] Cash flow forecast (projected balance based on upcoming bills/income)

**Investments**
- [ ] Stocks/mutual funds/crypto tracking, portfolio value, combined net worth
      (a bigger, separate domain from everything else here)

**Loyalty/rewards**
- [x] Points/miles tracking, expiry alerts, points ledger

**Reports & export**
- [ ] CSV/PDF export, custom date-range reports
- [ ] Tax-relevant category tagging

**Reminders & notifications**
- [ ] Bill due dates, budget threshold alerts, low balance alerts — the
      underlying data already exists (`due_day`, budget status), just no
      push/notification layer yet

**Security**
- [ ] PIN/biometric lock
- [x] Audit trail via `raw_data` (edits never lose the original values)

**Multi-user**
- [ ] Shared budgets/expense splitting — likely stays unbuilt, out of scope
      for a single-user personal app

## Data model

Schema lives in Airtable now (see the "Moving to Airtable" section below for
table/field details); `src/data/*.json` are kept only as the original
sample-data reference, not read by the app anymore.

- Accounts — id, name, type, institution, **initial_balance**, currency, status
- Transactions — id, account_id, type (income/expense/transfer), amount, category_id, date, note, created_at
- Categories — id, name, type, icon, color

Balances are never stored — they're computed on read in `src/lib/finance.ts`
(`accountBalance()`), so editing or deleting a transaction automatically
corrects every downstream number.

## Add-on cards & shared credit limits

An add-on/supplementary card links to its primary via `parent_account_id`
on `Account`. If `shares_credit_limit` is also true, the add-on pools the
*primary's* `credit_limit` instead of having its own — `getCardGroup()` and
`getCreditCardUsage()` in `finance.ts` compute combined outstanding/available
across every card in the group, so the primary and every linked add-on
always show the same utilization numbers, even though each card still
tracks its own transactions and its own individual balance separately.

An add-on can instead have its own **separate** limit by leaving
`shares_credit_limit` false — it's still linked to the primary for display
purposes (shows up under it, links back to it), it just doesn't pool.

**Creating one**: the Add Credit Card form has a "Link as an add-on card"
toggle — pick the primary from existing (non-add-on) credit cards, then
choose whether to share its limit. When sharing, the card's own Credit
Limit / Statement Date / Due Date inputs are hidden since those are
inherited from the primary.

**Where it shows up**: `CreditCardRow` (Accounts list) shows "Add-on of
{primary}" / "{N} add-on cards sharing this limit" as appropriate, and the
account detail page has a dedicated linkage section linking each direction.

## Budget

Two new Airtable tables back this — you'll need to create them in your base
before this page will show anything (see schema below).

**Why two tables**: a `Budget` row is the stable identity ("a budget for
Food & Dining"). The amount, period type, and recurrence live on
`BudgetVersion` instead, each with an `effective_from` date. **Amending a
budget only ever inserts a new version — it never edits an existing one.**
`getActiveVersion()` in `src/lib/budget.ts` picks whichever version has the
latest `effective_from` that isn't in the future, so:
- Viewing *today's* period always uses the newest version that's kicked in.
- Anything computed for a *past* period naturally uses whatever version was
  active back then, with zero special-casing — because that's just what
  "latest effective_from ≤ that date" resolves to for an earlier date.

**Period types & recurrence**:
- `day` — resets every calendar day, no recurrence anchor needed.
- `week` — `recurrence_day` is 0–6 (Sunday=0), the weekday the period
  starts on (e.g. "every Sunday").
- `month` — `recurrence_day` is 1–31, the day-of-month the period starts on
  (e.g. `1` for a calendar month, or `25` to align with a credit card
  statement cycle). Clamped for short months — a `recurrence_day` of 31
  correctly falls back to the last day of a 30-day or 28/29-day month
  rather than erroring.

All of this period-boundary math (`getPeriodBounds`) was verified against a
handful of edge cases (month-end clamping, weekly boundaries) before
shipping — see the reasoning in `budget.ts`'s doc comments if you're
extending it.

**Sample data** includes one deliberate amendment: the Food & Dining budget
started at ₹20,000/month (`effective_from: 2026-04-01`) and was raised to
₹25,000/month starting June (`effective_from: 2026-06-01`) — both versions
exist in `budget_versions.json`/`.csv`, so you can see the history feature
working without creating one yourself.

**Airtable tables to create:**

| Table: `budgets` | Type | Notes |
|---|---|---|
| `id` | Single line text (Primary) | e.g. `bud_001` |
| `category_id` | Single line text | → Categories.id |
| `active` | Checkbox | Deactivating hides it without losing version history |
| `created_at` | Single line text | ISO timestamp |

| Table: `budget_versions` | Type | Notes |
|---|---|---|
| `id` | Single line text (Primary) | e.g. `budv_001` |
| `budget_id` | Single line text | → Budgets.id |
| `amount` | Number | |
| `period_type` | Single select | Options: `day`, `week`, `month` |
| `recurrence_day` | Number | 0–6 for week, 1–31 for month, blank for day |
| `effective_from` | Date | |
| `created_at` | Single line text | ISO timestamp |

CSVs with the sample data for both tables are attached alongside this reply.

## Accounts screen

- **Net position**: `getNetPosition()` splits assets (everything except
  credit cards) from liabilities (credit card balances, already negative).
  The "vs last month" % compares against `getNetPositionAsOf()` 30 real
  days ago — with the shipped sample data this often reads 0%, since the
  sample transactions are clustered in a fixed historical window rather
  than the actual trailing 30 days. That's expected with static demo data.
- **Credit card due dates**: `nextOccurrenceOfDay()` in `finance.ts` turns
  a stored day-of-month (`due_day`, `statement_day`) into the next real
  calendar date — rolls to next month if that day's already passed this
  month.
- **Add Account**: `/accounts/add` is a type picker (Bank/Credit
  Card/Cash/Wallet) branching to a dedicated form per type, each posting
  to `POST /api/accounts` (same local-filesystem caveat as the transaction
  routes). A credit card's "Current Due Amount" field becomes its
  `initial_balance`, stored as negative debt — the same role
  `initial_balance` plays for every other account type.
- **Account detail** (`/accounts/[id]`) shows a full info grid plus that
  account's own transactions, with "View All" linking to
  `/transactions?account={id}` — the Transactions page reads that query
  param on load and pre-applies it as an Account filter.

## Bank icons

`src/lib/bankIcons.ts` maps an account's `institution` name to an icon URL,
with a generic fallback (`default.svg`) for anything unmapped. A mapped value
can be:

- a local file in `public/icons/banks/` — `.svg`, `.png`, `.jpg`/`.jpeg`, or `.ico`
- a third-party URL, e.g. `"https://cdn.example.com/hdfc-logo.png"`

To add or change a bank, add/edit one line in `BANK_ICON_MAP` — no component
changes needed. `BrandLogo` (used by `AccountCard` and `LoyaltyCard`) renders
whatever comes back with a plain `<img>` rather than `next/image`, so
external hosts work without touching `next.config.js`, and it falls back to
the given fallback icon automatically if a URL 404s or a remote host blocks
hotlinking.

**Note on the shipped icons**: the files in `public/icons/banks/` right now
are placeholder initials-in-a-circle monograms, not the banks' real logos —
I didn't reproduce actual bank trademarks. Swap in real logo files (or paste
a hosted URL) you've sourced yourself when you're ready.

## Loyalty program icons

Same pattern as bank icons, in `src/lib/loyaltyIcons.ts`. Unmapped programs
fall back to a generic icon *by category* (airline / hotel / other) rather
than one single default, in `public/icons/loyalty/default-{airline,hotel,other}.svg`.
Add a program's real logo by adding one line to `LOYALTY_ICON_MAP`.

## Linked transfers (credit card payments, ATM withdrawals, etc.)

Transfers are stored as **two linked rows**, not one — see `transfer_id`,
`transfer_direction`, `linked_account_id`, and `linked_transaction_id` on
`Transaction` in `src/lib/types.ts`. Paying off a credit card from your bank
account creates one row on the bank account (`transfer_direction: "out"`)
and one on the card (`"in"`), sharing a `transfer_id`. This keeps
`accountBalance()` a plain sum over each account's own rows — no special
"find the other half" logic needed for balance math — and correctly stops
credit card bill payments from double-counting as spending (the spend was
already counted when the card was originally charged; the bill payment is
just moving money, not a new expense).

**Creating one**: the Add Transaction page has a third "Transfer" option
alongside Expense/Income — pick a From and To account, no category needed.
`POST /api/transactions` detects `type: "transfer"` in the request and
writes both rows atomically.

**Viewing one**: the transaction detail page shows which account it's
linked to and links straight to the other leg. `TransactionRow` labels
these as "Transfer to/from {account}" instead of a merchant name.

Both `summarizePeriod()` and `categoryBreakdown()` in `finance.ts` only
ever look at `type === "income" | "expense"`, so transfers are
automatically excluded from Income/Expenses/Remaining and the spending
donut — as they should be, since moving your own money around isn't income
or spending.

## Merchant icons

`MembershipCard.tsx` (the card on each membership's detail page) is exactly
a 1:1.586 aspect ratio, set via inline `style` rather than a Tailwind class
so the value is unambiguous. Its color comes from `card_color` on the
program's data — a single hex value, from which `buildCardGradient()` in
`src/lib/color.ts` derives a 3-stop gradient. There's no color picker
anywhere in the UI; it's set per program in `loyalty.json` (or wherever
that data comes from once Airtable is wired in) and falls back to the
brand teal if unset.

Same pattern again, in `src/lib/merchantIcons.ts`, keyed on a transaction's
`merchant` field. This one behaves slightly differently: an unmapped
merchant returns `null` (not a generic fallback icon) so `MerchantIcon.tsx`
falls back to the transaction's *category* icon instead — which is what
every transaction already showed before this existed, so nothing changes
visually until you actually map a merchant. Add one by dropping a file in
`public/icons/merchants/` (or pasting a hosted URL) and adding a line to
`MERCHANT_ICON_MAP`.

## Transaction detail & editing

Clicking any transaction (dashboard or the Transactions list) opens
`/transactions/[id]`, showing transaction ID, date, time (from
`created_at`), type, source account, note, and category. `merchant` and
`category_id` are editable there — saving hits `PATCH
/api/transactions/[id]`, which only ever touches those two fields.

Every transaction also carries a `raw_data` snapshot (`merchant`,
`category_id`, `note` as originally parsed/entered) that this route never
writes to, so it stays as a reference to the original values no matter how
many times you correct the merchant name or category. An "Edited" badge
shows on the detail page once a transaction has been changed from its
original raw_data.

Same local-filesystem caveat as the create route: this only persists while
running `next dev`/`next start` locally, not on Vercel — swap for an
Airtable `update` request during the Phase 2 migration.

## Transaction filters

`src/lib/transactionFilters.ts` holds the filtering logic (pure functions,
no UI), `TransactionFilterSheet.tsx` is the bottom-sheet UI. Filters are
live — no separate "Apply" step, results update as you toggle:

- **Type** — All / Credit (income) / Debit (expense)
- **Source** — All / Bank Account / Credit Card. "Bank Account" covers
  `bank`, `savings`, `cash`, and `wallet` account types; "Credit Card"
  covers `credit_card` — see `SOURCE_ACCOUNT_TYPES` if you want to
  reclassify any of these.
- **Account** — multi-select, scoped to whatever Source allows. Selecting
  a Source resets the account selection back to "all" for that source.
- **Date** — Any / on a specific date / within ± N days of a date / a date
  range.
- **Amount** — Any / equals a specific amount / a min–max range.
- **Category** — multi-select, but the option list itself is filtered:
  `getAvailableCategories()` only offers categories that still have at
  least one matching transaction under the *other* active filters, so you
  can never pick a category that would return zero results.

## Moving to Airtable — done

**Airtable is now the live data source.** `finance.ts` and `loyalty.ts`'s
base getters (`getAccounts`, `getTransactions`, `getCategories`,
`getLoyaltyPrograms`, `getLoyaltyTransactions`) are `async` and fetch
through `airtableData.ts` — the local `src/data/*.json` files are no longer
imported anywhere in the app; they're kept around only as a historical
reference for the schema shape.

**What changed to make this work**, since it's a bigger shift than just
swapping an import:

- **Pure helpers now take arrays as parameters instead of fetching
  internally.** `getCategoryById(id, categories)`, `getProgramById(id,
  programs)`, `getTransactionsForProgram(id, transactions)`,
  `getProgramsWithBalances(programs, transactions)`, and
  `categoryBreakdown(transactions, range, categories, type)` all changed
  signature — they used to call the (then-synchronous) getters themselves.
  Everything else that was already pure (`accountBalance`,
  `summarizePeriod`, `trendSeries`, etc.) is untouched.
- **Pages that need data are now `async` Server Components** that `await`
  the getters directly: Dashboard, Transactions list, Transaction detail,
  Add Transaction, Accounts list, Account detail, Add Credit Card,
  Memberships list, Membership detail.
- **Client components (interactivity, forms) no longer fetch data
  themselves** — each was split into a thin async Server Component wrapper
  (`page.tsx`) that fetches via `finance.ts`/`loyalty.ts` and passes the
  results down as props, plus a `"use client"` component that keeps all the
  existing state/interaction logic unchanged. E.g. `dashboard/page.tsx`
  (server) → `DashboardClient.tsx` (client); same pattern for
  `TransactionsClient`, `TransactionDetailClient`, `AddTransactionForm`,
  `AddCreditCardForm`. This is required, not a style choice — Airtable's API
  key must never reach client-side JS, so anything client-rendered can't
  call `airtableData.ts` directly.
- **`TransactionRow` is now a pure prop-driven component** — it used to look
  up its own category (`getCategoryById`) and account (`getAccounts`)
  internally; now every caller passes `categories`/`accounts` down
  explicitly.
- **The write routes** (`POST /api/transactions`, `PATCH
  /api/transactions/[id]`, `POST /api/accounts`) now call
  `createTransactionInAirtable`, `createTransferInAirtable`,
  `updateTransactionInAirtable`, `createAccountInAirtable` from
  `airtableData.ts` instead of `fs.readFile`/`fs.writeFile` — so these now
  work on Vercel, not just local dev.

**Still worth deciding**: caching/revalidation strategy. Every fetcher
currently uses `cache: "no-store"`, meaning every page load hits Airtable
fresh — fine for verifying correctness, likely too chatty once this sees
real usage given Airtable's rate limits. Next.js's `revalidate` /
`unstable_cache` are the natural next step once usage patterns are clearer.

## Known placeholders to revisit

- `REFERENCE_DATE` in `src/app/dashboard/page.tsx` is hardcoded to match the
  sample data's month — swap for `new Date()` once real data is flowing.
- No auth yet — fine for personal use behind Vercel's own URL, but add at
  least a PIN gate before sharing the link anywhere.
- The app icon is SVG-only by design (single file, referenced everywhere).
  Most browsers and Android now render SVG manifest icons and favicons fine.
  iOS Safari's "Add to Home Screen" icon is the one exception — it still
  expects a raster PNG for `apple-touch-icon` and may fall back to a blank
  or default icon there. If the home-screen icon on iPhone matters to you,
  the fix later is a single PNG export of `icon.svg`, still generated from
  that one file.
