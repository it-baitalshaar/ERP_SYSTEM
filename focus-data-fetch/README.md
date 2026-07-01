# Focus Data Fetch — Deployment Guide

**Give this document to whoever installs the tool on the Focus server.**

---

## Quick answer

| Question | Answer |
|----------|--------|
| Where does this run? | **Only on the Focus server** — the Windows PC where Focus and SQL Server are installed (e.g. `SAQIA-FS-CLONE`) |
| Does it run on the cloud / new ERP server? | **No** |
| Does it run on your laptop? | **No** (unless your laptop is the Focus server) |
| What does it do? | Reads Focus SQL Server databases and copies raw data into **Supabase** (cloud backup). It does **not** change Focus or the new ERP yet. |
| Do you need to know Focus table names? | **No** — the script discovers and copies all tables automatically |

---

## What you are deploying

```
┌─────────────────────────────────────────┐
│  FOCUS SERVER (Windows)                 │
│  - Focus v6 software                    │
│  - SQL Server Express (SQLEXPRESS)      │
│  - Docker Desktop                       │
│  - This folder: C:\focus-data-fetch     │
└─────────────────┬───────────────────────┘
                  │  Internet (HTTPS)
                  ▼
┌─────────────────────────────────────────┐
│  SUPABASE (cloud)                       │
│  - focus_import_runs   (job log)        │
│  - focus_raw_catalog   (table list)     │
│  - focus_raw_batches   (actual data)    │
└─────────────────────────────────────────┘
```

---

## Before you start — checklist

### On the Focus server (installer)

- [ ] Windows PC with Focus installed and working
- [ ] SQL Server Express running (you can open it in **SSMS** as `MACHINENAME\SQLEXPRESS`)
- [ ] **Docker Desktop for Windows** installed and running
- [ ] Internet access (to reach Supabase)
- [ ] Administrator rights on the PC (for SQL TCP + firewall)

### From the ERP team (already prepared)

- [ ] This `focus-data-fetch` folder (copy whole folder to the server)
- [ ] `.env` file with Supabase URL and key (or fill from instructions below)
- [ ] Supabase migration `0014_focus_raw_staging.sql` already applied in Supabase

---

## Files to copy to the Focus server

Copy the entire folder to the server, for example:

```
C:\focus-data-fetch\
  ├── .env                 ← MUST edit before running (see below)
  ├── .env.example
  ├── docker-compose.yml
  ├── Dockerfile
  ├── package.json
  ├── README.md            ← this file
  └── src\
```

**Minimum on server:** the whole `focus-data-fetch` folder including `.env`.

---

## What you MUST change in `.env`

Open `C:\focus-data-fetch\.env` in Notepad and edit **only** the lines marked **CHANGE**:

```env
# --- Focus SQL Server ---
FOCUS_SQL_SERVER=host.docker.internal
FOCUS_SQL_PORT=1433
FOCUS_SQL_INSTANCE=
FOCUS_SQL_USER=sa
FOCUS_SQL_PASSWORD=CHANGE_ME          ← CHANGE: SQL Server password

FOCUS_DATABASES=Focus50G0             ← CHANGE: your Focus database name(s)
FOCUS_INCLUDE_EMPLOYEE_DB=false
FOCUS_MIN_ROWS=1
FOCUS_BATCH_SIZE=200

# --- Supabase (provided by ERP team) ---
NEXT_PUBLIC_SUPABASE_URL=https://hugyamagdsqgqsvsxyps.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...      ← already filled if ERP team sent .env
```

### Variable reference

| Variable | Change? | What to put |
|----------|---------|-------------|
| `FOCUS_SQL_SERVER` | **No** | Keep `host.docker.internal` (Docker on same PC as SQL) |
| `FOCUS_SQL_PORT` | **Maybe** | Real TCP port SQL listens on (usually `1433`) — see Step 2 below |
| `FOCUS_SQL_INSTANCE` | **No** | Leave **empty** if using `FOCUS_SQL_PORT` |
| `FOCUS_SQL_USER` | **Maybe** | `sa` or a read-only user like `focus_reader` |
| `FOCUS_SQL_PASSWORD` | **Yes** | SQL login password |
| `FOCUS_DATABASES` | **Yes** | Focus DB name from SSMS, e.g. `Focus50G0` or `Focus5010,Focus5020` |
| `FOCUS_INCLUDE_EMPLOYEE_DB` | **Maybe** | `true` only if you also want `employeeDB` |
| `NEXT_PUBLIC_SUPABASE_URL` | **No** | Provided by ERP team |
| `SUPABASE_SERVICE_ROLE_KEY` | **No** | Provided by ERP team (secret — do not share publicly) |

### How to find `FOCUS_DATABASES`

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to: `SAQIA-FS-CLONE\SQLEXPRESS` (use your machine name)
3. Expand **Databases** — you will see names like `Focus5010`, `Focus5020`, … `Focus50G0`
4. Put the main one in `.env` first. You can add more later, comma-separated.

---

## One-time setup on the Focus server

### Step 1 — Install Docker Desktop

1. Download: https://www.docker.com/products/docker-desktop/
2. Install and restart if asked
3. Open Docker Desktop — wait until it says **Running**
4. Test in PowerShell:

```powershell
docker --version
docker compose version
```

### Step 2 — Enable SQL Server TCP (required for Docker)

Docker cannot use `MACHINENAME\SQLEXPRESS` by name. It needs a **TCP port number**.

1. Open **SQL Server Configuration Manager**
2. Go to: **SQL Server Network Configuration** → **Protocols for SQLEXPRESS**
3. Right-click **TCP/IP** → **Enable**
4. Double-click **TCP/IP** → tab **IP Addresses** → scroll to **IPAll**
5. Set **TCP Port** = `1433` (clear **TCP Dynamic Ports** if it has a value)
6. Click **OK**
7. Restart **SQL Server (SQLEXPRESS)** service

**Find your port** (if unsure) — run in SSMS:

```sql
SELECT local_net_address, local_tcp_port
FROM sys.dm_exec_connections
WHERE session_id = @@SPID;
```

Put that port in `.env` as `FOCUS_SQL_PORT=1433` (or whatever number you see).

**Test port** in PowerShell:

```powershell
Test-NetConnection -ComputerName localhost -Port 1433
```

`TcpTestSucceeded : True` = good.

**Firewall:** allow inbound TCP on that port (Windows Firewall → Advanced → Inbound Rules).

### Step 3 — SQL login (if not using `sa`)

If `sa` is disabled, create a read-only user in SSMS:

```sql
CREATE LOGIN focus_reader WITH PASSWORD = 'YourStrongPassword123!';
USE Focus50G0;
CREATE USER focus_reader FOR LOGIN focus_reader;
ALTER ROLE db_datareader ADD MEMBER focus_reader;
```

Repeat `USE Focus50xx` for each database in `FOCUS_DATABASES`.

Then in `.env`:

```env
FOCUS_SQL_USER=focus_reader
FOCUS_SQL_PASSWORD=YourStrongPassword123!
```
<!-- 
### Step 4 — Supabase tables (ERP team — one time)

Someone with Supabase access must run the SQL migration once:

- File: `supabase/migrations/0014_focus_raw_staging.sql` (in the main ERP project)

In Supabase Dashboard → **SQL Editor** → paste and run that file.

**Skip this if the ERP team already confirmed it is done.** -->
### done already by aamir
---

## Deploy and run (installer steps)

Open **PowerShell as Administrator** (or normal user if Docker allows):

```powershell
cd C:\focus-data-fetch
```

### 1. Build the Docker image (first time only, or after updates)

```powershell
docker compose build
```

Wait until it finishes with no errors.

### 2. Test — explore (catalog only, no data copy yet)

```powershell
docker compose run --rm focus-fetch npm run explore
```

**Success looks like:**

```
Connecting to SQL Server: host.docker.internal:1433
=== Focus50G0 ===
Tables: 120 (45 with ≥ 1 rows)
  dbo.u0001                          15234 rows
  ...
✓ Catalog saved to Supabase
```

**If it fails**, see [Troubleshooting](#troubleshooting) below.

To scan **all** Focus databases on the server (recommended first time):

```powershell
docker compose run --rm focus-fetch npm run explore -- --all-databases
```

### 3. Copy data — sync

After explore works, copy real data to Supabase:

```powershell
docker compose run --rm focus-fetch npm run sync
```

Or sync every Focus database:

```powershell
docker compose run --rm focus-fetch npm run sync -- --all-databases
```

This can take **minutes to hours** depending on data size. Leave the window open until you see:

```
✓ Sync complete. 45 tables, 125000 rows → Supabase
```

---

## How to check if it is running

The job is **not** a Windows service. Each run starts, works, and exits.

| While running | After finished |
|---------------|----------------|
| PowerShell shows table names / progress | Message: `✓ Sync complete` or `✓ Catalog saved` |
| `docker ps` shows a `focus-fetch` container | `docker ps` shows nothing (normal) |
| | `docker ps -a` shows container **Exited (0)** = success |

---

## How to verify data reached Supabase

Ask the ERP team to run this in **Supabase → SQL Editor**, or give you dashboard access:

```sql
-- Last job status
SELECT status, server_name, databases, tables_synced, rows_synced,
       started_at, finished_at, error_message
FROM focus_import_runs
ORDER BY started_at DESC
LIMIT 5;
```

| `status` | Meaning |
|----------|---------|
| `completed` | Success |
| `running` | Still in progress |
| `failed` | See `error_message` |

```sql
-- Tables found
SELECT database_name, table_name, approx_row_count
FROM focus_raw_catalog
ORDER BY approx_row_count DESC
LIMIT 20;

-- Data copied
SELECT database_name, COUNT(*) AS batches, SUM(row_count) AS total_rows
FROM focus_raw_batches
GROUP BY database_name;
```

If `focus_raw_batches` has rows → **data is safely in Supabase.**

---

## Run again later (optional)

To refresh data from Focus (e.g. weekly):

```powershell
cd C:\focus-data-fetch
docker compose run --rm focus-fetch npm run sync
```

### Schedule with Windows Task Scheduler (optional)

1. Task Scheduler → Create Task
2. Trigger: Weekly (or Daily) at night
3. Action: Start a program
   - Program: `powershell.exe`
   - Arguments: `-NoProfile -Command "cd C:\focus-data-fetch; docker compose run --rm focus-fetch npm run sync"`
4. Run whether user is logged on or not (if Docker runs as service)

---

## Troubleshooting

| Error / symptom | What to do |
|-----------------|------------|
| `Failed to connect to host.docker.internal` | Docker Desktop not running; start it and retry |
| `Connection refused` / `ETIMEOUT` on port | Enable TCP/IP in SQL Config Manager; set port `1433`; restart SQL; test `Test-NetConnection localhost -Port 1433` |
| `Login failed for user` | Wrong `FOCUS_SQL_USER` / `FOCUS_SQL_PASSWORD` in `.env` |
| `Cannot open database "Focus50G0"` | Wrong name in `FOCUS_DATABASES` — check exact name in SSMS |
| Supabase error / table does not exist | ERP team must run migration `0014_focus_raw_staging.sql` |
| Sync very slow | Normal for large DBs; start with one database in `FOCUS_DATABASES` |
| `host.docker.internal` not found (old Docker) | Update Docker Desktop; `docker-compose.yml` already includes `extra_hosts` |

### Useful diagnostic commands

```powershell
# Is Docker running?
docker info

# Can we reach SQL port from Windows?
Test-NetConnection -ComputerName localhost -Port 1433

# Rebuild after code update
cd C:\focus-data-fetch
docker compose build --no-cache
```

---

## Who does what

| Task | Who |
|------|-----|
| Copy `focus-data-fetch` folder to Focus server | Installer / IT |
| Install Docker Desktop | Installer / IT |
| Enable SQL TCP + firewall | Installer / IT (admin) |
| Edit `.env` SQL password + database names | Installer / IT (with Focus admin) |
| Apply Supabase migration `0014` | ERP team |
| Provide Supabase URL + service key in `.env` | ERP team |
| Run `explore` and `sync` | Installer / IT |
| Verify data in Supabase | ERP team |
| Map data into new ERP (later) | ERP development team |

---

## Summary — 5 steps for the installer

1. **Copy** `focus-data-fetch` to `C:\focus-data-fetch` on the Focus server  
2. **Edit** `.env` — SQL password + `FOCUS_DATABASES` (+ port if not 1433)  
3. **Enable** SQL TCP port 1433 and install Docker Desktop  
4. **Run** `docker compose build` then `docker compose run --rm focus-fetch npm run explore`  
5. **Run** `docker compose run --rm focus-fetch npm run sync` and tell ERP team when done  

**You do not install anything on the new ERP server for this step.**  
**You do not need to write SQL queries or know Focus table names.**

---

## Contact

After successful sync, send the ERP team:

- Screenshot or copy of the final terminal message (`tables_synced`, `rows_synced`)
- Which databases were synced (`FOCUS_DATABASES` value)
- Date/time of the run

They will confirm in Supabase and plan the next step (mapping data into the new ERP).
