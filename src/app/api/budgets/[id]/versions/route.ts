import { NextRequest, NextResponse } from "next/server";
import { createBudgetVersionInAirtable } from "@/lib/airtableData";

// This is the entire "amendments don't affect old records" mechanism at the
// API layer: it only ever INSERTs a new budget_versions row. There is no
// update path for an existing version, by design - see the doc comment on
// getActiveVersion() in src/lib/budget.ts for why that's sufficient.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  const required = ["amount", "period_type", "effective_from"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const version = await createBudgetVersionInAirtable(params.id, {
      amount: Number(body.amount),
      period_type: body.period_type,
      recurrence_day: body.recurrence_day !== undefined ? Number(body.recurrence_day) : undefined,
      effective_from: body.effective_from,
    });
    return NextResponse.json({ version }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create budget amendment" },
      { status: 500 }
    );
  }
}
