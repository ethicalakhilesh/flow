import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import type { Transaction } from "@/lib/types";

const DATA_PATH = path.join(process.cwd(), "src/data/transactions.json");

// NOTE: same local-filesystem caveat as api/transactions/route.ts — this
// only works with `next dev`/`next start` on a writable filesystem, not on
// Vercel. Swap for an Airtable `update` request once that's wired in.
//
// Only `merchant` and `category_id` are editable here on purpose. `raw_data`
// is the immutable "what was originally parsed/entered" record and is never
// touched by this route, even if the request body includes it.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const raw = await fs.readFile(DATA_PATH, "utf-8");
  const transactions: Transaction[] = JSON.parse(raw);

  const index = transactions.findIndex((t) => t.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const existing = transactions[index];
  const updated: Transaction = {
    ...existing,
    merchant: typeof body.merchant === "string" ? body.merchant || undefined : existing.merchant,
    category_id: typeof body.category_id === "string" && body.category_id ? body.category_id : existing.category_id,
    // raw_data is intentionally omitted from this spread of `body` — it is
    // never updated by this route.
    edited: true,
  };

  transactions[index] = updated;
  await fs.writeFile(DATA_PATH, JSON.stringify(transactions, null, 2));

  return NextResponse.json({ transaction: updated });
}
