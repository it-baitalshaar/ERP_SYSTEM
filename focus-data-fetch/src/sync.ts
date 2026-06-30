import { assertConfig, config, resolveDatabaseList } from "./config.js";
import {
  countTableRows,
  fetchTableRows,
  listTables,
  listUserDatabases,
  sqlConnectionLabel,
  type TableInfo,
} from "./mssql.js";
import { finishImportRun, startImportRun, upsertCatalog } from "./supabase.js";

export async function runExplore(allDatabases: boolean): Promise<void> {
  assertConfig("explore");

  const server = sqlConnectionLabel();
  console.log(`\nConnecting to SQL Server: ${server}`);

  const discovered = await listUserDatabases();
  const databases = resolveDatabaseList(allDatabases, discovered);

  console.log(`\nDatabases on server (${discovered.length} total):`);
  for (const name of discovered) {
    const selected = databases.includes(name) ? " ← will sync" : "";
    console.log(`  - ${name}${selected}`);
  }

  if (!databases.length) {
    console.log("\nNo databases selected. Set FOCUS_DATABASES in .env or pass --all-databases");
    return;
  }

  const runId = await startImportRun(server, databases);
  let totalTables = 0;

  try {
    for (const database of databases) {
      console.log(`\n=== ${database} ===`);
      const tables = await listTables(database);
      const withData = tables.filter((t) => t.approxRowCount >= config.minRows);

      await upsertCatalog(runId, database, tables);

      totalTables += tables.length;
      console.log(`Tables: ${tables.length} (${withData.length} with ≥ ${config.minRows} rows)`);
      console.log("\nTop tables by row count:");
      for (const t of tables.slice(0, 25)) {
        console.log(
          `  ${t.schemaName}.${t.tableName.padEnd(28)} ${String(t.approxRowCount).padStart(10)} rows  (${t.columns.length} cols)`
        );
      }
      if (tables.length > 25) {
        console.log(`  ... and ${tables.length - 25} more`);
      }
    }

    await finishImportRun(runId, {
      status: "completed",
      tables_synced: totalTables,
      rows_synced: 0,
      summary: { mode: "explore", databases },
    });

    console.log("\n✓ Catalog saved to Supabase (focus_raw_catalog). No row data copied yet.");
    console.log("  Run: npm run sync   to copy table data into focus_raw_batches");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishImportRun(runId, {
      status: "failed",
      error_message: message,
      summary: { mode: "explore" },
    });
    throw err;
  }
}

export async function runSync(allDatabases: boolean): Promise<void> {
  assertConfig("sync");

  const server = sqlConnectionLabel();
  console.log(`\nConnecting to SQL Server: ${server}`);

  const discovered = await listUserDatabases();
  const databases = resolveDatabaseList(allDatabases, discovered);

  if (!databases.length) {
    throw new Error("No databases to sync. Run explore first or set FOCUS_DATABASES.");
  }

  const runId = await startImportRun(server, databases);
  let tablesSynced = 0;
  let rowsSynced = 0;
  const perDb: Record<string, { tables: number; rows: number }> = {};

  try {
    for (const database of databases) {
      console.log(`\n=== Syncing ${database} ===`);
      perDb[database] = { tables: 0, rows: 0 };

      const tables = await listTables(database);
      await upsertCatalog(runId, database, tables);

      const candidates = tables.filter((t) => t.approxRowCount >= config.minRows);
      console.log(`  ${candidates.length} tables with ≥ ${config.minRows} rows`);

      for (const table of candidates) {
        const synced = await syncTable(runId, database, table);
        if (synced.rows > 0) {
          tablesSynced += 1;
          rowsSynced += synced.rows;
          perDb[database].tables += 1;
          perDb[database].rows += synced.rows;
          console.log(
            `  ✓ ${table.schemaName}.${table.tableName}: ${synced.rows} rows (${synced.batches} batches)`
          );
        }
      }
    }

    await finishImportRun(runId, {
      status: "completed",
      tables_synced: tablesSynced,
      rows_synced: rowsSynced,
      summary: { mode: "sync", databases, perDb },
    });

    console.log(`\n✓ Sync complete. ${tablesSynced} tables, ${rowsSynced} rows → Supabase`);
    console.log(`  Run id: ${runId}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await finishImportRun(runId, {
      status: "failed",
      error_message: message,
      tables_synced: tablesSynced,
      rows_synced: rowsSynced,
      summary: { mode: "sync", databases, perDb },
    });
    throw err;
  }
}

async function syncTable(
  runId: string,
  database: string,
  table: TableInfo
): Promise<{ rows: number; batches: number }> {
  const { insertBatch } = await import("./supabase.js");

  const total = await countTableRows(database, table.schemaName, table.tableName);
  if (total < config.minRows) return { rows: 0, batches: 0 };

  let offset = 0;
  let batchIndex = 0;
  let copied = 0;

  while (offset < total) {
    const rows = await fetchTableRows(
      database,
      table.schemaName,
      table.tableName,
      offset,
      config.batchSize
    );
    if (!rows.length) break;

    await insertBatch({
      runId,
      databaseName: database,
      schemaName: table.schemaName,
      tableName: table.tableName,
      batchIndex,
      rows,
    });

    copied += rows.length;
    offset += rows.length;
    batchIndex += 1;
  }

  return { rows: copied, batches: batchIndex };
}
