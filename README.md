# Flow — Personal Finance (V1: Manual Entry)

A personal finance tracker: dashboard, transactions, accounts, manual entry.
Runs on Next.js, deploys to Vercel, currently backed by local JSON sample data.

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
- **Accounts**: balances derived automatically as `initial_balance + income − expenses`
- **Memberships**: airline miles, hotel points, and other loyalty programs — grouped by category, with an expiry warning banner for anything expiring within 90 days
- **PWA**: installable via `public/manifest.json`, icon sourced entirely from `public/icons/icon.svg` — one file, referenced everywhere (manifest, favicon, apple touch icon, sidebar logo). Swap that single file to rebrand.

## Data model (`src/data/*.json`)

- `accounts.json` — id, name, type, institution, **initial_balance**, currency, status
- `transactions.json` — id, account_id, type (income/expense/transfer), amount, category_id, date, note, created_at
- `categories.json` — id, name, type, icon, color

Balances are never stored — they're computed on read in `src/lib/finance.ts`
(`accountBalance()`), so editing or deleting a transaction automatically
corrects every downstream number.

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

## Merchant icons

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

## Moving to Airtable (Phase 2)

Everything reads through `src/lib/finance.ts`. To swap JSON for Airtable:

1. Replace the three `getAccounts()` / `getTransactions()` / `getCategories()`
   functions to fetch from Airtable's REST API instead of importing the JSON
   files. Keep their return shapes identical (`Account[]`, `Transaction[]`,
   `Category[]`) and nothing else in the app needs to change.
2. Replace `src/app/api/transactions/route.ts` — swap the `fs.readFile` /
   `fs.writeFile` calls for an Airtable `create` request. This route currently
   writes to the local JSON file, which only works in local dev; Vercel's
   production filesystem is read-only, so this **must** change before
   deploying real usage.
3. Add `AIRTABLE_API_KEY` and `AIRTABLE_BASE_ID` as environment variables in
   Vercel's project settings once ready.

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
