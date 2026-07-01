import { createAdminClientOrNull } from "@/utils/supabase/admin";

type Db = NonNullable<ReturnType<typeof createAdminClientOrNull>>;

export type FocusImportRun = {
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

export type FocusRawCatalogEntry = {
  id: string;
  run_id: string | null;
  database_name: string;
  schema_name: string;
  table_name: string;
  approx_row_count: number;
  columns: { name: string; dataType: string; nullable: boolean }[];
  discovered_at: string;
};

export type FocusBatchTableSummary = {
  database_name: string;
  schema_name: string;
  table_name: string;
  batch_count: number;
  row_count: number;
  last_imported_at: string;
};

export type FocusMigrationOverview = {
  staging_ready: boolean;
  latest_run: FocusImportRun | null;
  total_catalog_tables: number;
  total_databases: number;
  total_batches: number;
  total_rows_in_batches: number;
};

function mapRun(row: Record<string, unknown>): FocusImportRun {
  return {
    id: String(row.id),
    server_name: String(row.server_name ?? ""),
    status: row.status as FocusImportRun["status"],
    databases: Array.isArray(row.databases) ? row.databases.map(String) : [],
    tables_synced: Number(row.tables_synced) || 0,
    rows_synced: Number(row.rows_synced) || 0,
    error_message: row.error_message != null ? String(row.error_message) : null,
    summary: (row.summary as Record<string, unknown>) ?? {},
    started_at: String(row.started_at),
    finished_at: row.finished_at != null ? String(row.finished_at) : null,
  };
}

function mapCatalog(row: Record<string, unknown>): FocusRawCatalogEntry {
  const columns = Array.isArray(row.columns) ? row.columns : [];
  return {
    id: String(row.id),
    run_id: row.run_id != null ? String(row.run_id) : null,
    database_name: String(row.database_name),
    schema_name: String(row.schema_name ?? "dbo"),
    table_name: String(row.table_name),
    approx_row_count: Number(row.approx_row_count) || 0,
    columns: columns.map((c) => {
      const col = c as Record<string, unknown>;
      return {
        name: String(col.name ?? ""),
        dataType: String(col.dataType ?? col.data_type ?? ""),
        nullable: Boolean(col.nullable),
      };
    }),
    discovered_at: String(row.discovered_at),
  };
}

async function tableExists(db: Db, table: string): Promise<boolean> {
  const { error } = await db.from(table).select("id", { head: true, count: "exact" }).limit(1);
  return !error;
}

export async function getFocusMigrationOverview(db: Db): Promise<FocusMigrationOverview> {
  const staging_ready = await tableExists(db, "focus_import_runs");
  if (!staging_ready) {
    return {
      staging_ready: false,
      latest_run: null,
      total_catalog_tables: 0,
      total_databases: 0,
      total_batches: 0,
      total_rows_in_batches: 0,
    };
  }

  const { data: runs } = await db
    .from("focus_import_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1);

  const { count: catalogCount } = await db
    .from("focus_raw_catalog")
    .select("id", { head: true, count: "exact" });

  const { data: dbNames } = await db.from("focus_raw_catalog").select("database_name");
  const uniqueDbs = new Set((dbNames ?? []).map((r) => String(r.database_name)));

  const { count: batchCount } = await db
    .from("focus_raw_batches")
    .select("id", { head: true, count: "exact" });

  const { data: rowSum } = await db.from("focus_raw_batches").select("row_count");
  const total_rows_in_batches = (rowSum ?? []).reduce((sum, r) => sum + (Number(r.row_count) || 0), 0);

  return {
    staging_ready: true,
    latest_run: runs?.[0] ? mapRun(runs[0] as Record<string, unknown>) : null,
    total_catalog_tables: catalogCount ?? 0,
    total_databases: uniqueDbs.size,
    total_batches: batchCount ?? 0,
    total_rows_in_batches,
  };
}

export async function listFocusImportRuns(db: Db, limit = 50): Promise<FocusImportRun[]> {
  const { data, error } = await db
    .from("focus_import_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRun(row as Record<string, unknown>));
}

export async function listFocusRawCatalog(
  db: Db,
  opts?: { database?: string; limit?: number }
): Promise<FocusRawCatalogEntry[]> {
  let query = db
    .from("focus_raw_catalog")
    .select("*")
    .order("approx_row_count", { ascending: false });

  if (opts?.database) query = query.eq("database_name", opts.database);
  query = query.limit(opts?.limit ?? 500);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCatalog(row as Record<string, unknown>));
}

export async function listFocusBatchSummary(
  db: Db,
  runId: string
): Promise<FocusBatchTableSummary[]> {
  const { data, error } = await db
    .from("focus_raw_batches")
    .select("database_name, schema_name, table_name, row_count, imported_at")
    .eq("run_id", runId)
    .order("database_name")
    .order("table_name");

  if (error) throw new Error(error.message);

  const map = new Map<string, FocusBatchTableSummary>();
  for (const row of data ?? []) {
    const key = `${row.database_name}|${row.schema_name}|${row.table_name}`;
    const existing = map.get(key);
    const importedAt = String(row.imported_at);
    if (!existing) {
      map.set(key, {
        database_name: String(row.database_name),
        schema_name: String(row.schema_name ?? "dbo"),
        table_name: String(row.table_name),
        batch_count: 1,
        row_count: Number(row.row_count) || 0,
        last_imported_at: importedAt,
      });
    } else {
      existing.batch_count += 1;
      existing.row_count += Number(row.row_count) || 0;
      if (importedAt > existing.last_imported_at) {
        existing.last_imported_at = importedAt;
      }
    }
  }

  return [...map.values()].sort((a, b) => b.row_count - a.row_count);
}

export async function getFocusBatchSample(
  db: Db,
  opts: { runId: string; database: string; table: string; schema?: string }
): Promise<Record<string, unknown>[]> {
  let query = db
    .from("focus_raw_batches")
    .select("payload")
    .eq("run_id", opts.runId)
    .eq("database_name", opts.database)
    .eq("table_name", opts.table)
    .order("batch_index", { ascending: true })
    .limit(1);

  if (opts.schema) query = query.eq("schema_name", opts.schema);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const payload = data?.[0]?.payload;
  if (!Array.isArray(payload)) return [];
  return payload as Record<string, unknown>[];
}

export async function listFocusDatabaseNames(db: Db): Promise<string[]> {
  const { data, error } = await db
    .from("focus_raw_catalog")
    .select("database_name")
    .order("database_name");

  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((r) => String(r.database_name)))];
}
