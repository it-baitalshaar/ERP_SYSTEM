-- Log export, reset, and restore operations for shops, departments, branches, and warehouses.

create table if not exists public.org_data_operations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scope text not null check (scope in ('unit', 'branch', 'warehouse')),
  action text not null check (action in ('export', 'reset', 'restore')),
  entity_id uuid not null,
  entity_label text not null,
  summary text not null default '',
  backup jsonb not null,
  performed_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists org_data_operations_org_idx
  on public.org_data_operations (organization_id, created_at desc);

alter table public.org_data_operations disable row level security;
