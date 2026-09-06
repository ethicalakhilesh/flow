/**
 * Low-level Airtable client. Server-only — never import this from a "use
 * client" component, since AIRTABLE_API_KEY would then ship to the browser.
 * Use it from Server Components or Route Handlers only.
 */

const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

export interface AirtableRecord<TFields> {
  id: string;
  createdTime: string;
  fields: TFields;
}

interface AirtableListResponse<TFields> {
  records: AirtableRecord<TFields>[];
  offset?: string;
}

function getCredentials() {
  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!baseId || !apiKey) {
    throw new Error(
      "Missing AIRTABLE_BASE_ID or AIRTABLE_API_KEY. Copy .env.local.example to .env.local and fill in real values."
    );
  }
  return { baseId, apiKey };
}

/**
 * Fetches a single record by Airtable's own record ID (the "id" field
 * returned alongside every record from fetchAllRecords, e.g.
 * "recXXXXXXXXXXXXXX") — NOT by whatever your app's own `id` column holds
 * (e.g. "acc_hdfc"). Those are two different identifiers; there's no way
 * to fetch-by-app-id in a single request without either a filterByFormula
 * query against the list endpoint, or already knowing the Airtable record
 * ID from a prior list call.
 */
export async function fetchRecord<TFields>(
  tableName: string,
  recordId: string
): Promise<AirtableRecord<TFields> | null> {
  const { baseId, apiKey } = getCredentials();
  const url = `${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}/${encodeURIComponent(recordId)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Airtable request failed for record "${recordId}" in table "${tableName}": ${res.status} ${res.statusText} ${body}`
    );
  }

  return res.json();
}

/**
 * Airtable batches create/update to a max of 10 records per request.
 * Splits a larger array into chunks of that size.
 */
function chunk<T>(items: T[], size = 10): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function writeRecords<TFields>(
  tableName: string,
  method: "POST" | "PATCH",
  records: Array<{ id?: string; fields: Partial<TFields> }>
): Promise<AirtableRecord<TFields>[]> {
  const { baseId, apiKey } = getCredentials();
  const url = `${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}`;

  const results: AirtableRecord<TFields>[] = [];
  for (const batch of chunk(records)) {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      // typecast lets Airtable auto-create a new Single select option
      // (e.g. a category type it hasn't seen yet) instead of rejecting the
      // write outright — matches the app's own config-over-code philosophy
      // of not hardcoding an exhaustive option list in two places.
      body: JSON.stringify({ records: batch, typecast: true }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Airtable ${method} failed for table "${tableName}": ${res.status} ${res.statusText} ${body}`
      );
    }

    const data: AirtableListResponse<TFields> = await res.json();
    results.push(...data.records);
  }

  return results;
}

/** Creates one or more records. Returns the created records (with their new Airtable IDs). */
export async function createRecords<TFields>(
  tableName: string,
  records: Array<{ fields: Partial<TFields> }>
): Promise<AirtableRecord<TFields>[]> {
  return writeRecords<TFields>(tableName, "POST", records);
}

/** Convenience wrapper for creating a single record. */
export async function createRecord<TFields>(
  tableName: string,
  fields: Partial<TFields>
): Promise<AirtableRecord<TFields>> {
  const [created] = await createRecords<TFields>(tableName, [{ fields }]);
  return created;
}

/**
 * Updates one or more records. PATCH only touches the fields you include —
 * any field left out is untouched, matching how the app's own
 * /api/transactions/[id] route already does narrow, partial updates
 * (merchant/category_id only, never touching raw_data). Each record needs
 * its Airtable record ID (not the app's own `id` column) so Airtable knows
 * which row to update.
 */
export async function updateRecords<TFields>(
  tableName: string,
  records: Array<{ id: string; fields: Partial<TFields> }>
): Promise<AirtableRecord<TFields>[]> {
  return writeRecords<TFields>(tableName, "PATCH", records);
}

/** Convenience wrapper for updating a single record. */
export async function updateRecord<TFields>(
  tableName: string,
  recordId: string,
  fields: Partial<TFields>
): Promise<AirtableRecord<TFields>> {
  const [updated] = await updateRecords<TFields>(tableName, [{ id: recordId, fields }]);
  return updated;
}

/**
 * Fetches every record from a table, following pagination automatically
 * (Airtable caps each page at 100 records and returns an `offset` token
 * when there's more).
 */
/**
 * Resolves the app's own `id` field (e.g. "acc_hdfc") to Airtable's
 * internal record ID (e.g. "recXXXXXXXX"), using a filterByFormula query.
 * Needed because every write in this app is keyed by the app's own IDs
 * (that's what's in the URL for /accounts/[id] etc.), while
 * updateRecord()/fetchRecord() need Airtable's record ID. Returns null if
 * no record has that app ID.
 */
export async function findRecordIdByAppId(tableName: string, appId: string): Promise<string | null> {
  const escaped = appId.replace(/"/g, '\\"');
  const records = await fetchAllRecords<{ id?: string }>(tableName, {
    filterByFormula: `{id} = "${escaped}"`,
  });
  return records[0]?.id ?? null;
}

export async function fetchAllRecords<TFields>(
  tableName: string,
  options: { view?: string; filterByFormula?: string } = {}
): Promise<AirtableRecord<TFields>[]> {
  const { baseId, apiKey } = getCredentials();
  const all: AirtableRecord<TFields>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set("pageSize", "100");
    if (options.view) url.searchParams.set("view", options.view);
    if (options.filterByFormula) url.searchParams.set("filterByFormula", options.filterByFormula);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Data changes via the app's own writes too, so don't let Next cache
      // this indefinitely. Adjust once real usage patterns are clearer.
      cache: "no-store",
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Airtable request failed for table "${tableName}": ${res.status} ${res.statusText} ${body}`);
    }

    const data: AirtableListResponse<TFields> = await res.json();
    all.push(...data.records);
    offset = data.offset;
  } while (offset);

  return all;
}
