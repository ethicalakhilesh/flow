// Generic Airtable REST client. Env vars are read lazily (inside functions,
// not at module scope) so a missing var fails at request time, not at
// build/cold-start — same lesson as the JWKS bug in auth.ts.

function baseUrl(table: string) {
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!baseId) throw new Error("AIRTABLE_BASE_ID is not set");
  return `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
}

function authHeaders() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) throw new Error("AIRTABLE_API_KEY is not set");
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

type AirtableRecord<T> = { id: string; fields: T };
type AirtableListResponse<T> = { records: AirtableRecord<T>[]; offset?: string };

export async function fetchAllRecords<T>(
  table: string,
  opts: { view?: string; filterByFormula?: string } = {}
): Promise<AirtableRecord<T>[]> {
  const records: AirtableRecord<T>[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(baseUrl(table));
    if (opts.view) url.searchParams.set("view", opts.view);
    if (opts.filterByFormula) url.searchParams.set("filterByFormula", opts.filterByFormula);
    if (offset) url.searchParams.set("offset", offset);

    const res = await fetch(url.toString(), { headers: authHeaders(), cache: "no-store" });
    if (!res.ok) throw new Error(`Airtable fetchAllRecords(${table}) failed: ${res.status}`);
    const data: AirtableListResponse<T> = await res.json();
    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

export async function fetchRecord<T>(table: string, recordId: string): Promise<AirtableRecord<T>> {
  const res = await fetch(`${baseUrl(table)}/${recordId}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Airtable fetchRecord(${table}, ${recordId}) failed: ${res.status}`);
  return res.json();
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export async function createRecords<T extends object>(
  table: string,
  fieldsList: T[]
): Promise<AirtableRecord<T>[]> {
  const created: AirtableRecord<T>[] = [];
  for (const batch of chunk(fieldsList, 10)) {
    const res = await fetch(baseUrl(table), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        records: batch.map((fields) => ({ fields })),
        typecast: true,
      }),
    });
    if (!res.ok) throw new Error(`Airtable createRecords(${table}) failed: ${res.status}`);
    const data: AirtableListResponse<T> = await res.json();
    created.push(...data.records);
  }
  return created;
}

export async function updateRecords<T extends object>(
  table: string,
  updates: { id: string; fields: Partial<T> }[]
): Promise<AirtableRecord<T>[]> {
  const updated: AirtableRecord<T>[] = [];
  for (const batch of chunk(updates, 10)) {
    const res = await fetch(baseUrl(table), {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ records: batch, typecast: true }),
    });
    if (!res.ok) throw new Error(`Airtable updateRecords(${table}) failed: ${res.status}`);
    const data: AirtableListResponse<T> = await res.json();
    updated.push(...data.records);
  }
  return updated;
}

export async function deleteRecords(table: string, recordIds: string[]): Promise<void> {
  for (const batch of chunk(recordIds, 10)) {
    const url = new URL(baseUrl(table));
    for (const id of batch) url.searchParams.append("records[]", id);
    const res = await fetch(url.toString(), { method: "DELETE", headers: authHeaders() });
    if (!res.ok) throw new Error(`Airtable deleteRecords(${table}) failed: ${res.status}`);
  }
}

export async function findRecordIdByAppId(table: string, appId: string): Promise<string | null> {
  const records = await fetchAllRecords<{ id: string }>(table, {
    filterByFormula: `{id} = "${appId}"`,
  });
  return records[0]?.id ?? null;
}
