import { NextResponse } from "next/server";
import {
  fetchAccounts,
  fetchTransactions,
  fetchCategories,
  fetchLoyaltyPrograms,
  fetchLoyaltyTransactions,
  fetchAccountByRecordId,
} from "@/lib/airtableData";
import { fetchAllRecords } from "@/lib/airtable";

/**
 * Hit this route (GET /api/airtable-test) to confirm your Airtable
 * connection and field names are set up correctly, before anything in the
 * app actually depends on it. Returns a row count + first record per table
 * so you can eyeball that field mapping came through right (correct types,
 * no unexpectedly-undefined fields), plus a check that fetching a single
 * record by Airtable's own record ID also works.
 *
 * Delete this route once you're confident the connection works and the
 * real read layer (finance.ts / loyalty.ts) has been switched over.
 */
export async function GET() {
  const tables = {
    accounts: fetchAccounts,
    transactions: fetchTransactions,
    categories: fetchCategories,
    loyalty_programs: fetchLoyaltyPrograms,
    loyalty_transactions: fetchLoyaltyTransactions,
  };

  const results: Record<string, { count: number; sample: unknown } | { error: string }> = {};

  for (const [name, fetcher] of Object.entries(tables)) {
    try {
      const rows = await fetcher();
      results[name] = { count: rows.length, sample: rows[0] ?? null };
    } catch (err) {
      results[name] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Also verify the single-record-by-id path, using the Airtable record ID
  // (not the app's own `id` field) of whatever the first accounts row is.
  let singleRecordCheck: { recordId: string; matched: boolean } | { error: string };
  try {
    const [firstRaw] = await fetchAllRecords<{ id?: string }>("accounts");
    if (!firstRaw) {
      singleRecordCheck = { error: "No account records to test against." };
    } else {
      const single = await fetchAccountByRecordId(firstRaw.id);
      singleRecordCheck = {
        recordId: firstRaw.id,
        matched: single?.id === firstRaw.fields.id,
      };
    }
  } catch (err) {
    singleRecordCheck = { error: err instanceof Error ? err.message : String(err) };
  }

  const anyErrors =
    Object.values(results).some((r) => "error" in r) || "error" in singleRecordCheck;

  return NextResponse.json(
    { tables: results, singleRecordFetch: singleRecordCheck },
    { status: anyErrors ? 500 : 200 }
  );
}
