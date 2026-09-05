import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { Account } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "src/data/accounts.json");

// Same local-filesystem caveat as api/transactions/route.ts — works with
// `next dev`/`next start` locally, not on Vercel. Swap for an Airtable
// `create` request during the Phase 2 migration.
export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["name", "type", "initial_balance"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const accounts: Account[] = JSON.parse(raw);

  const newAccount: Account = {
    id: `acc_${Date.now()}`,
    name: body.name,
    type: body.type,
    institution: body.institution || undefined,
    initial_balance: Number(body.initial_balance),
    currency: body.currency || "INR",
    status: "active",
    account_subtype: body.account_subtype || undefined,
    last_four: body.last_four || undefined,
    is_primary: Boolean(body.is_primary),
    ifsc_code: body.ifsc_code || undefined,
    account_holder: body.account_holder || undefined,
    opened_date: body.opened_date || undefined,
    credit_limit: body.credit_limit !== undefined ? Number(body.credit_limit) : undefined,
    statement_day: body.statement_day !== undefined ? Number(body.statement_day) : undefined,
    due_day: body.due_day !== undefined ? Number(body.due_day) : undefined,
    payment_reminder: body.payment_reminder !== undefined ? Boolean(body.payment_reminder) : undefined,
  };

  // If this account is marked primary, un-mark any other account of the same
  // broad group (bank vs credit card) so there's only ever one primary.
  let updated = accounts;
  if (newAccount.is_primary) {
    updated = accounts.map((a) => (a.type === newAccount.type ? { ...a, is_primary: false } : a));
  }
  updated.push(newAccount);

  await fs.writeFile(DATA_PATH, JSON.stringify(updated, null, 2));

  return NextResponse.json({ account: newAccount }, { status: 201 });
}
