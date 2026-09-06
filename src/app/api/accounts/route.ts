import { NextRequest, NextResponse } from "next/server";
import { createAccountInAirtable } from "@/lib/airtableData";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["name", "type", "initial_balance"];
  for (const field of required) {
    if (body[field] === undefined || body[field] === "") {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const account = await createAccountInAirtable({
      name: body.name,
      type: body.type,
      institution: body.institution || undefined,
      initial_balance: Number(body.initial_balance),
      currency: body.currency || "INR",
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
      parent_account_id: body.parent_account_id || undefined,
      shares_credit_limit: body.shares_credit_limit !== undefined ? Boolean(body.shares_credit_limit) : undefined,
    });
    return NextResponse.json({ account }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create account" },
      { status: 500 }
    );
  }
}
