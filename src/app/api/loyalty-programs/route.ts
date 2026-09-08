import { NextRequest, NextResponse } from "next/server";
import { createLoyaltyProgramInAirtable } from "@/lib/airtableData";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const required = ["brand", "program_name", "points_name", "category"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  try {
    const program = await createLoyaltyProgramInAirtable({
      brand: body.brand,
      program_name: body.program_name,
      points_name: body.points_name,
      category: body.category,
      member_id: body.member_id || undefined,
      starting_balance: body.starting_balance ? Number(body.starting_balance) : 0,
      tier: body.tier || undefined,
      expiry_date: body.expiry_date || undefined,
      notes: body.notes || undefined,
    });
    return NextResponse.json({ program }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create membership" },
      { status: 500 }
    );
  }
}
