import { NextRequest, NextResponse } from "next/server";
import { setBudgetActiveInAirtable } from "@/lib/airtableData";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const body = await request.json();

  if (typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Missing or invalid field: active" }, { status: 400 });
  }

  try {
    const budget = await setBudgetActiveInAirtable(params.id, body.active);
    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }
    return NextResponse.json({ budget });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update budget" },
      { status: 500 }
    );
  }
}
