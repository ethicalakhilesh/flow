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
 * Fetches every record from a table, following pagination automatically
 * (Airtable caps each page at 100 records and returns an `offset` token
 * when there's more).
 */
export async function fetchAllRecords<TFields>(
  tableName: string,
  options: { view?: string } = {}
): Promise<AirtableRecord<TFields>[]> {
  const { baseId, apiKey } = getCredentials();
  const all: AirtableRecord<TFields>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set("pageSize", "100");
    if (options.view) url.searchParams.set("view", options.view);
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
