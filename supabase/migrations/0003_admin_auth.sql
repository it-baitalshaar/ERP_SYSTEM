-- Admin-managed auth: profiles store password_hash (no Supabase Auth)
-- Run after 0001_init.sql

alter table public.profiles drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id set default gen_random_uuid();

alter table public.profiles
  add column if not exists password_hash text;

create unique index if not exists profiles_email_unique on public.profiles (lower(email));

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop auth.uid()-based RLS; server uses service role with app-layer checks
drop policy if exists "companies_select" on public.companies;
drop policy if exists "companies_update_admin" on public.companies;
drop policy if exists "branches_select" on public.branches;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_self" on public.profiles;
drop policy if exists "user_companies_select" on public.user_companies;
drop policy if exists "user_branches_select" on public.user_branches;
drop policy if exists "feature_flags_select" on public.feature_flags;
drop policy if exists "feature_flags_all_admin" on public.feature_flags;
drop policy if exists "customers_company" on public.customers;
drop policy if exists "quotations_company" on public.quotations;
drop policy if exists "sales_orders_company" on public.sales_orders;
drop policy if exists "tax_invoices_company" on public.tax_invoices;
drop policy if exists "roles_read" on public.roles;
drop policy if exists "permissions_read" on public.permissions;

alter table public.companies disable row level security;
alter table public.branches disable row level security;
alter table public.profiles disable row level security;
alter table public.user_companies disable row level security;
alter table public.user_branches disable row level security;
alter table public.feature_flags disable row level security;
alter table public.customers disable row level security;
alter table public.quotations disable row level security;
alter table public.sales_orders disable row level security;
alter table public.tax_invoices disable row level security;
alter table public.roles disable row level security;
alter table public.permissions disable row level security;
