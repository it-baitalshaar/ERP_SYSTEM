import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "./config.js";

export type ImportRun = {
  id: string;
  server_name: string;
  status: "running" | "completed" | "failed";
  databases: string[];
  tables_synced: number;
  rows_synced: number;
  error_message: string | null;
  summary: Record<string, unknown>;
  started_at: string;
  finished_at: string | null;
};

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return client;
}

export async function startImportRun(serverName: string, databases: string[]): Promise<string> {
  const db = getSupabase();
  const { data, error } = await db
    .from("focus_import_runs")
    .insert({
      server_name: serverName,
      status: "running",
      databases,
      summary: {},
    })
    .select("id")
    .single();

  if (error || !data) throw new Error(`Failed to start import run: ${error?.message}`);
  return data.id as string;
}

export async function finishImportRun(
  runId: string,
  patch: Partial<Pick<ImportRun, "status" | "tables_synced" | "rows_synced" | "error_message" | "summary">>
): Promise<void> {
  const db = getSupabase();
  const { error } = await db
    .from("focus_import_runs")
    .update({
      ...patch,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);

  if (error) throw new Error(`Failed to finish import run: ${error.message}`);
}

export async function upsertCatalog(
  runId: string,
  databaseName: string,
  tables: {
    schemaName: string;
    tableName: string;
    approxRowCount: number;
    columns: unknown[];
  }[]
): Promise<void> {
  if (!tables.length) return;

  const db = getSupabase();
  const rows = tables.map((t) => ({
    run_id: runId,
    database_name: databaseName,
    schema_name: t.schemaName,
    table_name: t.tableName,
    approx_row_count: t.approxRowCount,
    columns: t.columns,
    discovered_at: new Date().toISOString(),
  }));

  const { error } = await db.from("focus_raw_catalog").upsert(rows, {
    onConflict: "database_name,schema_name,table_name",
  });

  if (error) throw new Error(`Failed to upsert catalog for ${databaseName}: ${error.message}`);
}

export async function insertBatch(payload: {
  runId: string;
  databaseName: string;
  schemaName: string;
  tableName: string;
  batchIndex: number;
  rows: Record<string, unknown>[];
}): Promise<void> {
  const db = getSupabase();
  const { error } = await db.from("focus_raw_batches").insert({
    run_id: payload.runId,
    database_name: payload.databaseName,
    schema_name: payload.schemaName,
    table_name: payload.tableName,
    batch_index: payload.batchIndex,
    row_count: payload.rows.length,
    payload: payload.rows,
  });

  if (error) {
    throw new Error(
      `Failed to insert batch ${payload.databaseName}.${payload.tableName}#${payload.batchIndex}: ${error.message}`
    );
  }
}
