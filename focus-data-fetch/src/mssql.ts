import sql from "mssql";
import { config } from "./config.js";

export type TableInfo = {
  schemaName: string;
  tableName: string;
  approxRowCount: number;
  columns: { name: string; dataType: string; maxLength: number | null; nullable: boolean }[];
};

export function sqlConnectionLabel(): string {
  const { server, port, instance } = config.sql;
  return instance ? `${server}\\${instance}` : `${server}:${port}`;
}

export function buildSqlConfig(database?: string): sql.config {
  const { server, port, instance, user, password, encrypt, trustServerCertificate } = config.sql;

  const base: sql.config = {
    user,
    password,
    server,
    database,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
    },
    pool: { max: 5, min: 0, idleTimeoutMillis: 30_000 },
  };

  if (instance) {
    base.options = { ...base.options, instanceName: instance };
  } else {
    base.port = port;
  }

  return base;
}

export async function withSqlPool<T>(
  database: string | undefined,
  fn: (pool: sql.ConnectionPool) => Promise<T>
): Promise<T> {
  const pool = await sql.connect(buildSqlConfig(database));
  try {
    return await fn(pool);
  } finally {
    await pool.close();
  }
}

export async function listUserDatabases(): Promise<string[]> {
  return withSqlPool(undefined, async (pool) => {
    const result = await pool.request().query<{ name: string }>(`
      SELECT name
      FROM sys.databases
      WHERE database_id > 4
        AND state_desc = 'ONLINE'
      ORDER BY name
    `);
    return result.recordset.map((r) => r.name);
  });
}

export async function listTables(database: string): Promise<TableInfo[]> {
  return withSqlPool(database, async (pool) => {
    const tables = await pool.request().query<{
      schema_name: string;
      table_name: string;
      approx_rows: number;
    }>(`
      SELECT
        s.name AS schema_name,
        t.name AS table_name,
        SUM(CASE WHEN p.index_id IN (0, 1) THEN p.rows ELSE 0 END) AS approx_rows
      FROM sys.tables t
      INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
      INNER JOIN sys.partitions p ON p.object_id = t.object_id
      GROUP BY s.name, t.name
      ORDER BY approx_rows DESC, t.name
    `);

    const columns = await pool.request().query<{
      schema_name: string;
      table_name: string;
      column_name: string;
      data_type: string;
      max_length: number | null;
      is_nullable: string;
    }>(`
      SELECT
        c.TABLE_SCHEMA AS schema_name,
        c.TABLE_NAME AS table_name,
        c.COLUMN_NAME AS column_name,
        c.DATA_TYPE AS data_type,
        c.CHARACTER_MAXIMUM_LENGTH AS max_length,
        c.IS_NULLABLE AS is_nullable
      FROM INFORMATION_SCHEMA.COLUMNS c
      INNER JOIN INFORMATION_SCHEMA.TABLES t
        ON t.TABLE_SCHEMA = c.TABLE_SCHEMA AND t.TABLE_NAME = c.TABLE_NAME
      WHERE t.TABLE_TYPE = 'BASE TABLE'
      ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
    `);

    const columnMap = new Map<string, TableInfo["columns"]>();
    for (const col of columns.recordset) {
      const key = `${col.schema_name}.${col.table_name}`;
      const list = columnMap.get(key) ?? [];
      list.push({
        name: col.column_name,
        dataType: col.data_type,
        maxLength: col.max_length,
        nullable: col.is_nullable === "YES",
      });
      columnMap.set(key, list);
    }

    return tables.recordset.map((row) => ({
      schemaName: row.schema_name,
      tableName: row.table_name,
      approxRowCount: Number(row.approx_rows) || 0,
      columns: columnMap.get(`${row.schema_name}.${row.table_name}`) ?? [],
    }));
  });
}

function quoteIdent(schema: string, table: string): string {
  return `[${schema.replace(/]/g, "]]")}].[${table.replace(/]/g, "]]")}]`;
}

export async function fetchTableRows(
  database: string,
  schemaName: string,
  tableName: string,
  offset: number,
  limit: number
): Promise<Record<string, unknown>[]> {
  return withSqlPool(database, async (pool) => {
    const ident = quoteIdent(schemaName, tableName);
    const result = await pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit)
      .query(`SELECT * FROM ${ident} ORDER BY (SELECT NULL) OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`);

    return result.recordset.map((row) => serializeRow(row));
  });
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else if (Buffer.isBuffer(value)) {
      out[key] = value.toString("base64");
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function countTableRows(
  database: string,
  schemaName: string,
  tableName: string
): Promise<number> {
  return withSqlPool(database, async (pool) => {
    const ident = quoteIdent(schemaName, tableName);
    const result = await pool.request().query<{ cnt: number }>(
      `SELECT COUNT_BIG(*) AS cnt FROM ${ident}`
    );
    return Number(result.recordset[0]?.cnt ?? 0);
  });
}
