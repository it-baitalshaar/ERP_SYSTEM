-- Raw staging for Focus v6 SQL Server imports (populated by focus-data-fetch Docker job).
-- ERP mapping happens later; this preserves source data as JSON batches.

create table if not exists public.focus_import_runs (
  id uuid primary key default gen_random_uuid(),
  server_name text not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  databases text[] not null default '{}',
  tables_synced int not null default 0,
  rows_synced bigint not null default 0,
  error_message text,
  summary jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists focus_import_runs_started_idx
  on public.focus_import_runs (started_at desc);

create table if not exists public.focus_raw_catalog (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.focus_import_runs (id) on delete set null,
  database_name text not null,
  schema_name text not null default 'dbo',
  table_name text not null,
  approx_row_count bigint not null default 0,
  columns jsonb not null default '[]'::jsonb,
  discovered_at timestamptz not null default now(),
  unique (database_name, schema_name, table_name)
);

create index if not exists focus_raw_catalog_db_idx
  on public.focus_raw_catalog (database_name, table_name);

create table if not exists public.focus_raw_batches (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.focus_import_runs (id) on delete cascade,
  database_name text not null,
  schema_name text not null default 'dbo',
  table_name text not null,
  batch_index int not null,
  row_count int not null,
  payload jsonb not null,
  imported_at timestamptz not null default now(),
  unique (run_id, database_name, schema_name, table_name, batch_index)
);

create index if not exists focus_raw_batches_lookup_idx
  on public.focus_raw_batches (database_name, table_name, imported_at desc);

comment on table public.focus_import_runs is 'Log of each Focus SQL → Supabase raw sync job';
comment on table public.focus_raw_catalog is 'Discovered Focus table metadata (names, columns, row counts)';
comment on table public.focus_raw_batches is 'Raw Focus row data as JSON arrays (batch_size rows per record)';

alter table public.focus_import_runs disable row level security;
alter table public.focus_raw_catalog disable row level security;
alter table public.focus_raw_batches disable row level security;
