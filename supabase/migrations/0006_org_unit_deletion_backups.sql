-- Archive backups when an admin deletes a department (branches/warehouses are transferred first).

create table if not exists public.org_unit_deletion_backups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deleted_unit_id uuid not null,
  deleted_unit_name text not null,
  transferred_to_unit_id uuid references public.companies(id) on delete set null,
  backup jsonb not null,
  deleted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists org_unit_deletion_backups_org_idx
  on public.org_unit_deletion_backups (organization_id, created_at desc);

alter table public.org_unit_deletion_backups disable row level security;
