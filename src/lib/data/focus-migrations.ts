import type {
  FocusBatchTableSummary,
  FocusImportRun,
  FocusMigrationOverview,
  FocusRawCatalogEntry,
} from "@/lib/server/focus-migrations";

export type {
  FocusBatchTableSummary,
  FocusImportRun,
  FocusMigrationOverview,
  FocusRawCatalogEntry,
};

async function getJson(url: string): Promise<{ data?: unknown; error?: string }> {
  const res = await fetch(url);
  const json = (await res.json()) as { error?: string };
  if (!res.ok) return { error: json.error ?? "Request failed" };
  return { data: json };
}

export async function fetchFocusMigrationOverview(): Promise<{
  data?: FocusMigrationOverview;
  error?: string;
}> {
  const r = await getJson("/api/admin/migrations?resource=overview");
  if (r.error) return { error: r.error };
  return { data: r.data as FocusMigrationOverview };
}

export async function fetchFocusImportRuns(): Promise<{
  data?: FocusImportRun[];
  error?: string;
}> {
  const r = await getJson("/api/admin/migrations?resource=runs");
  if (r.error) return { error: r.error };
  const body = r.data as { runs: FocusImportRun[] };
  return { data: body.runs };
}

export async function fetchFocusRawCatalog(database?: string): Promise<{
  data?: FocusRawCatalogEntry[];
  error?: string;
}> {
  const qs = database ? `&database=${encodeURIComponent(database)}` : "";
  const r = await getJson(`/api/admin/migrations?resource=catalog${qs}`);
  if (r.error) return { error: r.error };
  const body = r.data as { catalog: FocusRawCatalogEntry[] };
  return { data: body.catalog };
}

export async function fetchFocusBatchSummary(runId: string): Promise<{
  data?: FocusBatchTableSummary[];
  error?: string;
}> {
  const r = await getJson(
    `/api/admin/migrations?resource=batch_summary&run_id=${encodeURIComponent(runId)}`
  );
  if (r.error) return { error: r.error };
  const body = r.data as { summary: FocusBatchTableSummary[] };
  return { data: body.summary };
}

export async function fetchFocusBatchSample(params: {
  runId: string;
  database: string;
  table: string;
  schema?: string;
}): Promise<{ data?: Record<string, unknown>[]; error?: string }> {
  const sp = new URLSearchParams({
    resource: "batch_sample",
    run_id: params.runId,
    database: params.database,
    table: params.table,
  });
  if (params.schema) sp.set("schema", params.schema);
  const r = await getJson(`/api/admin/migrations?${sp}`);
  if (r.error) return { error: r.error };
  const body = r.data as { sample: Record<string, unknown>[] };
  return { data: body.sample };
}

export async function fetchFocusDatabaseNames(): Promise<{ data?: string[]; error?: string }> {
  const r = await getJson("/api/admin/migrations?resource=databases");
  if (r.error) return { error: r.error };
  const body = r.data as { databases: string[] };
  return { data: body.databases };
}
