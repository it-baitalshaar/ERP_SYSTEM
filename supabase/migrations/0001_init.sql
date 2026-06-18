-- ERP Phase 2 — initial schema (companies, RBAC, feature flags, sales module)
-- Safe to re-run: types/policies/triggers use IF NOT EXISTS or DROP IF EXISTS.
-- If you only need seed data, run the INSERT sections at the bottom instead.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Companies & branches
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_license_no text,
  logo_url text,
  address text,
  currency text not null default 'AED',
  vat_trn text,
  fiscal_year_start text not null default '01-01',
  business_lines text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  code text not null,
  address text,
  is_head_office boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

-- ---------------------------------------------------------------------------
-- Roles & permissions
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id text primary key,
  name text not null,
  description text,
  is_system boolean not null default true
);

create table if not exists public.permissions (
  id bigserial primary key,
  role_id text not null references public.roles(id) on delete cascade,
  module_key text not null,
  actions text[] not null default '{}',
  unique (role_id, module_key)
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role_id text not null references public.roles(id),
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_companies (
  user_id uuid not null references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  primary key (user_id, company_id)
);

create table if not exists public.user_branches (
  user_id uuid not null references public.profiles(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  primary key (user_id, branch_id)
);

-- ---------------------------------------------------------------------------
-- Feature flags (per company — admin overrides)
-- ---------------------------------------------------------------------------
create table if not exists public.feature_flags (
  id bigserial primary key,
  company_id uuid not null references public.companies(id) on delete cascade,
  flag_key text not null,
  enabled boolean not null,
  updated_at timestamptz not null default now(),
  unique (company_id, flag_key)
);

-- ---------------------------------------------------------------------------
-- Sales module
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.document_status as enum (
    'draft', 'pending_approval', 'approved', 'rejected', 'posted', 'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.customer_classification as enum ('vip', 'wholesale', 'retail');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  classification public.customer_classification not null default 'retail',
  credit_limit numeric(15,2) not null default 0,
  outstanding_balance numeric(15,2) not null default 0,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  customer_id uuid not null references public.customers(id),
  number text not null,
  date date not null default current_date,
  valid_until date,
  status public.document_status not null default 'draft',
  lines jsonb not null default '[]',
  total numeric(15,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  customer_id uuid not null references public.customers(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  lines jsonb not null default '[]',
  total numeric(15,2) not null default 0,
  salesperson_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

create table if not exists public.tax_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  customer_id uuid not null references public.customers(id),
  sales_order_id uuid references public.sales_orders(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  lines jsonb not null default '[]',
  subtotal numeric(15,2) not null default 0,
  vat_amount numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  is_paid boolean not null default false,
  e_invoice_status text,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists companies_updated_at on public.companies;
create trigger companies_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.user_companies enable row level security;
alter table public.user_branches enable row level security;
alter table public.feature_flags enable row level security;
alter table public.customers enable row level security;
alter table public.quotations enable row level security;
alter table public.sales_orders enable row level security;
alter table public.tax_invoices enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;

-- Helper: company IDs the current user belongs to
create or replace function public.user_company_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select company_id from public.user_companies where user_id = auth.uid();
$$;

-- Companies: members can read; super admin / company admin can update
drop policy if exists "companies_select" on public.companies;
create policy "companies_select" on public.companies for select
  using (id in (select public.user_company_ids()));

drop policy if exists "companies_update_admin" on public.companies;
create policy "companies_update_admin" on public.companies for update
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role_id in ('role-super', 'role-company-admin')
        and exists (select 1 from public.user_companies uc where uc.user_id = p.id and uc.company_id = companies.id)
    )
  );

-- Branches
drop policy if exists "branches_select" on public.branches;
create policy "branches_select" on public.branches for select
  using (company_id in (select public.user_company_ids()));

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select
  using (id = auth.uid() or exists (
    select 1 from public.user_companies uc1
    join public.user_companies uc2 on uc1.company_id = uc2.company_id
    where uc1.user_id = auth.uid() and uc2.user_id = profiles.id
  ));

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self" on public.profiles for select using (id = auth.uid());

-- user_companies / user_branches
drop policy if exists "user_companies_select" on public.user_companies;
create policy "user_companies_select" on public.user_companies for select
  using (user_id = auth.uid() or company_id in (select public.user_company_ids()));

drop policy if exists "user_branches_select" on public.user_branches;
create policy "user_branches_select" on public.user_branches for select
  using (user_id = auth.uid());

-- Feature flags
drop policy if exists "feature_flags_select" on public.feature_flags;
create policy "feature_flags_select" on public.feature_flags for select
  using (company_id in (select public.user_company_ids()));

drop policy if exists "feature_flags_all_admin" on public.feature_flags;
create policy "feature_flags_all_admin" on public.feature_flags for all
  using (
    exists (
      select 1 from public.profiles p
      join public.user_companies uc on uc.user_id = p.id and uc.company_id = feature_flags.company_id
      where p.id = auth.uid() and p.role_id in ('role-super', 'role-company-admin')
    )
  );

-- Sales tables — company scoped
drop policy if exists "customers_company" on public.customers;
create policy "customers_company" on public.customers for all
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

drop policy if exists "quotations_company" on public.quotations;
create policy "quotations_company" on public.quotations for all
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

drop policy if exists "sales_orders_company" on public.sales_orders;
create policy "sales_orders_company" on public.sales_orders for all
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

drop policy if exists "tax_invoices_company" on public.tax_invoices;
create policy "tax_invoices_company" on public.tax_invoices for all
  using (company_id in (select public.user_company_ids()))
  with check (company_id in (select public.user_company_ids()));

-- Roles & permissions — readable by authenticated users
drop policy if exists "roles_read" on public.roles;
create policy "roles_read" on public.roles for select to authenticated using (true);

drop policy if exists "permissions_read" on public.permissions;
create policy "permissions_read" on public.permissions for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Seed roles
-- ---------------------------------------------------------------------------
insert into public.roles (id, name, description, is_system) values
  ('role-super', 'Super Admin', 'Full system access', true),
  ('role-company-admin', 'Company Admin', 'Company-level administration', true),
  ('role-accountant', 'Accountant', 'Finance and accounting', true),
  ('role-cashier', 'Cashier', 'Invoicing and payments', true),
  ('role-sales', 'Salesperson', 'Sales orders and CRM', true),
  ('role-warehouse', 'Warehouse Staff', 'Inventory operations', true),
  ('role-procurement', 'Procurement Officer', 'Purchasing', true),
  ('role-hr', 'HR/PRO Officer', 'HR and government services', true),
  ('role-driver', 'Driver/Logistics Officer', 'Fleet and trips', true),
  ('role-auditor', 'Auditor', 'Read-only audit access', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Seed companies (fixed UUIDs for reproducible seeds)
-- ---------------------------------------------------------------------------
insert into public.companies (id, name, trade_license_no, address, currency, vat_trn, fiscal_year_start, business_lines)
values
  (
    '11111111-1111-4111-8111-111111111101',
    'AL SAQIYA TRADING',
    'CN-ALSAQIYA-001',
    'Dubai, UAE',
    'AED',
    '100123456700003',
    '01-01',
    array['trading']::text[]
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'Bait Al-Shaar General Contracting and Maintenance',
    'CN-BAS-GCM-001',
    'Sharjah, UAE',
    'AED',
    '100765432100003',
    '01-01',
    array['construction', 'real_estate']::text[]
  )
on conflict (id) do update set
  name = excluded.name,
  business_lines = excluded.business_lines,
  updated_at = now();

insert into public.branches (id, company_id, name, code, address, is_head_office)
values
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'Dubai HQ',
    'DXB',
    'Al Quoz Industrial Area, Dubai',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111102',
    'Sharjah Office',
    'SHJ',
    'Industrial Area, Sharjah',
    true
  )
on conflict (id) do nothing;

-- Seed sample customers for AL SAQIYA TRADING
insert into public.customers (id, company_id, name, email, phone, classification, credit_limit, outstanding_balance, is_blocked)
values
  (
    '44444444-4444-4444-8444-444444444401',
    '11111111-1111-4111-8111-111111111101',
    'Emirates Building Materials',
    'procurement@ebm.ae',
    '+971 4 123 4567',
    'wholesale',
    500000, 125000, false
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '11111111-1111-4111-8111-111111111101',
    'Al Noor Trading',
    'orders@alnoor.ae',
    '+971 2 987 6543',
    'vip',
    1000000, 890000, false
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '11111111-1111-4111-8111-111111111101',
    'Quick Mart LLC',
    'buyer@quickmart.ae',
    '+971 50 111 2233',
    'retail',
    50000, 62000, true
  )
on conflict (id) do nothing;

insert into public.sales_orders (id, company_id, branch_id, customer_id, number, date, status, lines, total)
values
  (
    '55555555-5555-4555-8555-555555555501',
    '11111111-1111-4111-8111-111111111101',
    '22222222-2222-4222-8222-222222222201',
    '44444444-4444-4444-8444-444444444401',
    'SO-DXB-2026-00123',
    '2026-06-05',
    'approved',
    '[{"item_name":"Ceramic Tiles 60x60","qty":500,"unit_price":85}]'::jsonb,
    40375
  )
on conflict (id) do nothing;

-- Auto-handle new user profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role_id', 'role-auditor')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
