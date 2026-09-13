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

## Authentication (sso-auth, steps 1–5 of Phase 4)

Flow authenticates via **sso-auth**, a separate, already-deployed OIDC
provider — not something built inside this repo. Flow is its first real
client. Env vars needed: `SSO_ISSUER`, `SSO_CLIENT_ID`, `SSO_REDIRECT_URI`,
and `FLOW_SESSION_SECRET` (see `.env.local.example`).

**The flow:**
1. `GET /api/auth/login` — generates a PKCE `code_verifier`/`code_challenge`
   pair and a CSRF `state`, stores both in short-lived httpOnly cookies,
   redirects to `${SSO_ISSUER}/authorize`. No client secret anywhere — PKCE
   plus sso-auth's public JWKS replace that entirely for a public client
   like Flow.
2. `GET /api/auth/callback` — validates `state`, exchanges the returned
   `code` for tokens at sso-auth's token endpoint, verifies the `id_token`
   against sso-auth's JWKS (`src/lib/sso.ts`'s `getSsoJwks`, checking
   `issuer`/`audience`), then sets **Flow's own session** — not sso-auth's
   token — and clears the transient cookies.
3. `src/middleware.ts` gates every route (pages *and* `/api/*`, except the
   auth routes themselves and static assets) on that session cookie alone.
   sso-auth is never contacted again after step 2 — this is the whole point
   of Flow minting its own session rather than re-verifying the ID token on
   every request.

**Flow's own session** (`src/lib/session.ts`) is a signed HS256 JWT in an
httpOnly `flow_session` cookie, 30-day lifetime — deliberately independent
of and longer than sso-auth's 1-hour ID token, which has no refresh flow
yet (that's sso-auth's own Phase 5, a different phase than this one).

**Fixed bug**: `/api/auth/login` was getting cached (`cache=HIT` in production
logs), silently serving the *same* baked-in `code_verifier`/`state`/`Set-Cookie`
to every visitor instead of generating fresh ones per request — which is
exactly what produced "missing state/code_verifier cookie" failures in the
callback route. Root cause: a GET Route Handler with no dynamic API usage
(no `NextRequest` param, no `cookies()`/`headers()` call) is treated by
Next.js's App Router as static and cacheable by default. All three auth
routes now explicitly export `dynamic = "force-dynamic"` and
`revalidate = 0` — the login route also sets an explicit `Cache-Control:
no-store` header as defense-in-depth against a misconfigured CDN/edge cache
reintroducing the same bug independently of Next.js's own behavior. If you
ever add another route that mints a per-request secret (a new OAuth-style
flow, a one-time token, etc.), it needs the same two exports.

**Logged-out UX**: unauthenticated page visits (via middleware) and
`/api/auth/logout` both land on `/logged-out` — a real page with a "Log In"
button — rather than bouncing straight into sso-auth with no stop in
between. That matters most right after logging out: redirecting straight
back to `/api/auth/login` would immediately restart the OIDC flow, making
"log out" look like it didn't do anything.

**Mobile profile menu**: `ProfileMenu.tsx`, top-left on the Dashboard
(mobile only — desktop already has Settings/Log out via the sidebar).
Circular avatar showing the first letter of the username pulled from
`x-flow-user-username` — the header middleware forwards but nothing read
until now. Dropdown has Settings (placeholder page, also fixes what was
previously a dead link in the sidebar) and Log out.

**Two deviations from the plan doc worth knowing about**, since I couldn't
verify either against a running sso-auth instance:
- Added `scope=openid` to the `/authorize` redirect — required by OIDC spec
  for the response to include an ID token at all, but not listed in the
  plan's parameter list. Remove if sso-auth's `/authorize` rejects an
  unrecognized param.
- API routes get a `401 {"error": "Not authenticated"}` when logged out,
  not a redirect — a `fetch()` call that got redirected to sso-auth's
  hosted login page would follow it, get HTML back, and fail confusingly on
  `res.json()`. Pages still redirect normally.

**Still ahead**: step 6 confirmed clean by grepping the codebase — no old auth
remnants existed to remove (Flow had none before this), and every env var
referenced in code is documented in `.env.local.example`. Step 7's checklist,
verified as far as static code review allows:

- [x] **Tampering with the session cookie is rejected** — verified by
  construction: `verifySessionToken` wraps `jwtVerify` in a try/catch that
  returns `null` on any failure, and jose's HMAC verification will reject
  any single-byte change to a signed JWT. Not run against a live instance,
  but this part needs no network call to test — it's pure JWT logic.
- [x] **Refresh doesn't trigger another sso-auth round trip** — verified by
  reading `middleware.ts`: the authenticated path only calls
  `verifySessionToken` (local, no network), and never references
  `SSO_ISSUER` or makes a `fetch()` call at all once a valid session exists.
- [x] **Logout clears Flow's session without touching sso-auth** — now
  built (`/api/auth/logout`, linked from the sidebar); deliberately makes
  no call to sso-auth at all, consistent with Flow's session being
  independent after login.
- [ ] **The actual logged-out → sso-auth login form → back into Flow round
  trip** — this is the one item I genuinely can't verify myself. It
  depends on sso-auth's real `/authorize` and `/api/oidc/token` endpoints
  behaving exactly as the integration plan describes, which I have no way
  to confirm without a live deployment and real credentials. This needs
  you to click through it after deploying.

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
