import { NextRequest, NextResponse } from "next/server";
import { createTransactionInAirtable, createTransferInAirtable } from "@/lib/airtableData";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Transfers create TWO linked rows (one per account) - see
  // Transaction.transfer_id in types.ts for why: it keeps each account's
  // balance a plain sum over its own rows instead of needing special-case
  // "the other side" logic.
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

    try {
      const [outLeg, inLeg] = await createTransferInAirtable({
        from_account_id: body.from_account_id,
        to_account_id: body.to_account_id,
        amount: Number(body.amount),
        date: body.date,
        note: body.note || undefined,
      });
      return NextResponse.json({ transactions: [outLeg, inLeg] }, { status: 201 });
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Failed to create transfer" },
        { status: 500 }
      );
    }
  }

  // Regular income/expense — single row.
  const required = ["account_id", "type", "amount", "category_id", "date"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const transaction = await createTransactionInAirtable({
      account_id: body.account_id,
      type: body.type,
      amount: Number(body.amount),
      category_id: body.category_id,
      merchant: body.merchant || undefined,
      date: body.date,
      note: body.note || undefined,
    });
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create transaction" },
      { status: 500 }
    );
  }
}
