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
- **PWA**: installable via `public/manifest.json`, icon sourced entirely from `public/icons/icon.svg` — one file, referenced everywhere (manifest, favicon, apple touch icon, sidebar logo). Swap that single file to rebrand.

## Data model (`src/data/*.json`)

- `accounts.json` — id, name, type, institution, **initial_balance**, currency, status
- `transactions.json` — id, account_id, type (income/expense/transfer), amount, category_id, date, note, created_at
- `categories.json` — id, name, type, icon, color

Balances are never stored — they're computed on read in `src/lib/finance.ts`
(`accountBalance()`), so editing or deleting a transaction automatically
corrects every downstream number.

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
