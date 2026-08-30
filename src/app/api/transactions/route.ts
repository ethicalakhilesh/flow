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

  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const transactions: Transaction[] = JSON.parse(raw);

  // Transfers create TWO linked rows (one per account) in a single request,
  // rather than the usual single expense/income row. See Transaction.transfer_id
  // in types.ts for why: it keeps each account's balance a plain sum over
  // its own rows instead of needing special-case "the other side" logic.
  if (body.type === "transfer") {
    const required = ["from_account_id", "to_account_id", "amount", "date"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }
    if (body.from_account_id === body.to_account_id) {
      return NextResponse.json({ error: "From and To accounts must be different" }, { status: 400 });
    }

    const now = Date.now();
    const transferId = `tr_${now}`;
    const outId = `txn_${now}_out`;
    const inId = `txn_${now}_in`;
    const createdAt = new Date().toISOString();
    const note = body.note || undefined;

    const outLeg: Transaction = {
      id: outId,
      account_id: body.from_account_id,
      type: "transfer",
      amount: Number(body.amount),
      category_id: "cat_transfer",
      date: body.date,
      note,
      created_at: createdAt,
      transfer_id: transferId,
      transfer_direction: "out",
      linked_account_id: body.to_account_id,
      linked_transaction_id: inId,
      raw_data: { merchant: undefined, category_id: "cat_transfer", note },
      edited: false,
    };

    const inLeg: Transaction = {
      id: inId,
      account_id: body.to_account_id,
      type: "transfer",
      amount: Number(body.amount),
      category_id: "cat_transfer",
      date: body.date,
      note,
      created_at: createdAt,
      transfer_id: transferId,
      transfer_direction: "in",
      linked_account_id: body.from_account_id,
      linked_transaction_id: outId,
      raw_data: { merchant: undefined, category_id: "cat_transfer", note },
      edited: false,
    };

    transactions.push(outLeg, inLeg);
    await fs.writeFile(DATA_PATH, JSON.stringify(transactions, null, 2));

    return NextResponse.json({ transactions: [outLeg, inLeg] }, { status: 201 });
  }

  // Regular income/expense — single row.
  const required = ["account_id", "type", "amount", "category_id", "date"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

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
    raw_data: {
      merchant: body.merchant || undefined,
      category_id: body.category_id,
      note: body.note || undefined,
    },
    edited: false,
  };

  transactions.push(newTransaction);
  await fs.writeFile(DATA_PATH, JSON.stringify(transactions, null, 2));

  return NextResponse.json({ transaction: newTransaction }, { status: 201 });
}
