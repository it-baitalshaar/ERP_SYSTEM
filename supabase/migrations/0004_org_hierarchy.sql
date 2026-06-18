-- Organization hierarchy: Organization → Shop/Department → Branch / Warehouse
-- Each level can carry its own trade license number.

-- ---------------------------------------------------------------------------
-- Organizations (top-level legal entity)
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_license_no text,
  address text,
  currency text not null default 'AED',
  vat_trn text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Companies = shops or departments under an organization
alter table public.companies
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.companies
  add column if not exists unit_type text not null default 'department';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'companies_unit_type_check'
  ) then
    alter table public.companies
      add constraint companies_unit_type_check
      check (unit_type in ('shop', 'department'));
  end if;
end $$;

-- Branch-level trade license
alter table public.branches
  add column if not exists trade_license_no text;

-- ---------------------------------------------------------------------------
-- Warehouses (under shop/department, separate license)
-- ---------------------------------------------------------------------------
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  trade_license_no text,
  address text,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

-- ---------------------------------------------------------------------------
-- User access
-- ---------------------------------------------------------------------------
create table if not exists public.user_organizations (
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  primary key (user_id, organization_id)
);

create table if not exists public.user_warehouses (
  user_id uuid not null references public.profiles(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  primary key (user_id, warehouse_id)
);

-- ---------------------------------------------------------------------------
-- Backfill: one organization per existing company row
-- ---------------------------------------------------------------------------
do $$
declare
  c record;
  oid uuid;
begin
  for c in
    select * from public.companies where organization_id is null
  loop
    insert into public.organizations (name, trade_license_no, address, currency, vat_trn)
    values (c.name, c.trade_license_no, c.address, c.currency, c.vat_trn)
    returning id into oid;

    update public.companies
    set organization_id = oid, unit_type = 'department'
    where id = c.id;

    insert into public.user_organizations (user_id, organization_id)
    select uc.user_id, oid
    from public.user_companies uc
    where uc.company_id = c.id
    on conflict do nothing;
  end loop;
end $$;

alter table public.organizations disable row level security;
alter table public.warehouses disable row level security;
alter table public.user_organizations disable row level security;
alter table public.user_warehouses disable row level security;
