import { NextRequest, NextResponse } from "next/server";
import { createBudgetInAirtable } from "@/lib/airtableData";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["category_id", "amount", "period_type", "effective_from"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const result = await createBudgetInAirtable({
      category_id: body.category_id,
      amount: Number(body.amount),
      period_type: body.period_type,
      recurrence_day: body.recurrence_day !== undefined ? Number(body.recurrence_day) : undefined,
      effective_from: body.effective_from,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create budget" },
      { status: 500 }
    );
  }
}
