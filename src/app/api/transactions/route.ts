import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { Transaction } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "src/data/transactions.json");

// NOTE: This writes directly to the local transactions.json file, which only
// works when running `next dev`/`next start` on a machine with a writable
// filesystem. Vercel's production filesystem is read-only, so once this is
// wired up to Airtable, replace the fs.readFile/writeFile calls below with an
// Airtable `create` request and remove this comment.
export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["account_id", "type", "amount", "category_id", "date"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const transactions: Transaction[] = JSON.parse(raw);

  const newTransaction: Transaction = {
    id: `txn_${Date.now()}`,
    account_id: body.account_id,
    type: body.type,
    amount: Number(body.amount),
    category_id: body.category_id,
    merchant: body.merchant || undefined,
    date: body.date,
    note: body.note || undefined,
    created_at: new Date().toISOString(),
  };

  transactions.push(newTransaction);
  await fs.writeFile(DATA_PATH, JSON.stringify(transactions, null, 2));

  return NextResponse.json({ transaction: newTransaction }, { status: 201 });
}
