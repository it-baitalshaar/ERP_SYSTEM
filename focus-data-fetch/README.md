# Focus Data Fetch

Standalone Docker job that runs **on the Focus server** (where SQL Server lives), discovers all Focus tables automatically, and copies raw row data into **Supabase staging tables**. No ERP wiring yet — data is preserved safely in the cloud for later mapping.

## You do NOT need to write SQL queries

Focus uses cryptic table names (`u0001`, `curncd`, `C0E0EMPORDER`, …). You do not need to know which table is “customers” or “items” right now.

This tool runs the same discovery queries you used in SSMS:

- `INFORMATION_SCHEMA.TABLES` — list tables  
- `sys.tables` + `sys.partitions` — row counts  
- `SELECT * FROM [table]` — copy all rows  

Later, when wiring the new ERP, we inspect `focus_raw_catalog` and `focus_raw_batches` in Supabase to map tables.

## Architecture

```
Focus server (Windows)
  SQL Server Express  SAQIA-FS-CLONE\SQLEXPRESS
  Focus5010 … Focus50G0, employeeDB
        │
        │  Docker: focus-data-fetch
        ▼
Supabase (cloud)
  focus_import_runs      — job log
  focus_raw_catalog      — table names, columns, row counts
  focus_raw_batches      — actual data (JSON arrays)
```

## Prerequisites

### 1. Supabase migration

Apply `supabase/migrations/0014_focus_raw_staging.sql` on your Supabase project (SQL editor or `supabase db push`).

### 2. SQL Server reachable from Docker

On the Focus PC:

1. **SQL Server Configuration Manager** → SQL Server Network Configuration → Protocols for `SQLEXPRESS` → enable **TCP/IP**.
2. Set a **static port** (e.g. `1433`) on TCP/IP properties → IP Addresses → IPAll → TCP Port.
3. Restart SQL Server service.
4. Open Windows Firewall for that port (inbound).
5. Create a SQL login (or use `sa`) with read access to Focus databases.

From Docker, use:

- `FOCUS_SQL_SERVER=host.docker.internal`
- `FOCUS_SQL_PORT=1433` (your static port)
- Leave `FOCUS_SQL_INSTANCE` empty when using a fixed port

If you keep a named instance without a static port, set `FOCUS_SQL_INSTANCE=SQLEXPRESS` and ensure **SQL Server Browser** is running.

### 3. Docker Desktop on the Focus server

Install Docker Desktop for Windows on `SAQIA-FS-CLONE` (or whichever machine hosts SQL Server).

## Setup on the Focus server

```powershell
# Copy this folder to the Focus server, e.g. C:\focus-data-fetch
cd C:\focus-data-fetch

copy .env.example .env
# Edit .env — SQL credentials + Supabase URL + service role key

docker compose build
```

### `.env` example

```env
FOCUS_SQL_SERVER=host.docker.internal
FOCUS_SQL_PORT=1433
FOCUS_SQL_USER=sa
FOCUS_SQL_PASSWORD=YourPassword

# Start with one DB; add more comma-separated after explore looks good
FOCUS_DATABASES=Focus50G0

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Commands

### Step 1 — Explore (catalog only, no row copy)

Lists every database and table; saves metadata to `focus_raw_catalog`.

```powershell
docker compose run --rm focus-fetch npm run explore
```

To list **all** `Focus*` databases on the server:

```powershell
docker compose run --rm focus-fetch npm run explore -- --all-databases
```

### Step 2 — Sync (copy data to Supabase)

```powershell
docker compose run --rm focus-fetch npm run sync
```

Sync all Focus databases:

```powershell
docker compose run --rm focus-fetch npm run sync -- --all-databases
```

### Options via `.env`

| Variable | Default | Purpose |
|----------|---------|---------|
| `FOCUS_DATABASES` | — | Comma-separated DB names to sync |
| `FOCUS_INCLUDE_EMPLOYEE_DB` | `false` | Also sync `employeeDB` |
| `FOCUS_MIN_ROWS` | `1` | Skip tables with fewer rows |
| `FOCUS_BATCH_SIZE` | `200` | Rows per Supabase insert |

## Which Focus database to use?

From your SSMS screenshot you have many databases: `Focus5010` … `Focus5090`, `Focus50A0` … `Focus50G0`.

Usually **each `Focus50xx` = one company / shop / year** in Focus. Run `explore --all-databases` and check which DB has the largest row counts in the top tables — that is likely your main live data.

Set that name in `FOCUS_DATABASES` first. You can sync the rest later.

## Verify in Supabase

After sync, in Supabase SQL editor:

```sql
-- Latest job
select * from focus_import_runs order by started_at desc limit 5;

-- Tables discovered
select database_name, table_name, approx_row_count
from focus_raw_catalog
order by approx_row_count desc
limit 30;

-- Sample rows from a table (replace names)
select payload
from focus_raw_batches
where database_name = 'Focus50G0' and table_name = 'u0001'
limit 1;
```

## Scheduling (optional)

Run nightly on the Focus server with Windows Task Scheduler:

```powershell
cd C:\focus-data-fetch
docker compose run --rm focus-fetch npm run sync
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Failed to connect` | TCP/IP + static port; test with SSMS from host first |
| `Login failed` | Check `FOCUS_SQL_USER` / `FOCUS_SQL_PASSWORD` |
| `host.docker.internal` not found | Use Docker Desktop; `extra_hosts` is in compose file |
| Huge sync / timeout | Lower `FOCUS_DATABASES` to one DB; increase `FOCUS_BATCH_SIZE` carefully |
| Empty tables synced | Lower `FOCUS_MIN_ROWS` to `0` for catalog-only empty tables |

## Next step (later)

Map `focus_raw_batches` → ERP tables (`customers`, `items`, `suppliers`, …) via a separate import job or Admin “Fetch from Focus” UI in the main Next.js app.
