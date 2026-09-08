import { NextRequest, NextResponse } from "next/server";
import { updateTransactionInAirtable } from "@/lib/airtableData";

// Only `merchant` and `category_id` are editable here on purpose. `raw_data`
// is the immutable "what was originally parsed/entered" record and is never
// touched by this route, even if the request body includes it — see
// updateTransactionInAirtable() in airtableData.ts, which only ever sets
// those two fields (plus `edited`) regardless of what's passed in.
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  try {
    const updated = await updateTransactionInAirtable(params.id, {
      merchant: typeof body.merchant === "string" ? body.merchant : undefined,
      category_id: typeof body.category_id === "string" ? body.category_id : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update transaction" },
      { status: 500 }
    );
  }
}
