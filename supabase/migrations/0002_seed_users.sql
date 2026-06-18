-- Seed company users and feature flags.
-- IMPORTANT: run this only after 0003_admin_auth.sql (which removes
-- profiles.id -> auth.users FK for admin-managed authentication).

-- Profiles
insert into public.profiles (id, email, full_name, role_id, is_active)
values
  ('33333333-3333-4333-8333-333333333301', 'admin@alsaqiya.ae', 'System Administrator', 'role-super', true),
  ('33333333-3333-4333-8333-333333333302', 'sales@alsaqiya.ae', 'Al Saqiya Sales', 'role-sales', true),
  ('33333333-3333-4333-8333-333333333303', 'cashier@alsaqiya.ae', 'Al Saqiya Cashier', 'role-cashier', true),
  ('33333333-3333-4333-8333-333333333304', 'accountant@alsaqiya.ae', 'Al Saqiya Accountant', 'role-accountant', true)
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  role_id = excluded.role_id;

-- Admin → both companies; Al Saqiya staff → trading company only
insert into public.user_companies (user_id, company_id)
values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111101'),
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111102'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111101'),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111101'),
  ('33333333-3333-4333-8333-333333333304', '11111111-1111-4111-8111-111111111101')
on conflict do nothing;

insert into public.user_branches (user_id, branch_id)
values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222201'),
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222202'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222201'),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222201'),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222201')
on conflict do nothing;

-- Seed default feature-flag overrides for AL SAQIYA (trading defaults)
insert into public.feature_flags (company_id, flag_key, enabled)
select
  '11111111-1111-4111-8111-111111111101',
  unnest(array[
    'mod_sales', 'mod_procurement', 'mod_inventory', 'mod_finance', 'mod_ecommerce',
    'feat_batch_tracking', 'mod_compliance', 'mod_hr', 'mod_bi', 'mod_documents',
    'mod_ai', 'feat_e_invoicing'
  ]),
  true
on conflict (company_id, flag_key) do nothing;

-- Bait Al-Shaar (construction + real estate defaults)
insert into public.feature_flags (company_id, flag_key, enabled)
select
  '11111111-1111-4111-8111-111111111102',
  unnest(array[
    'mod_construction', 'mod_real_estate', 'mod_procurement', 'mod_inventory', 'mod_finance',
    'mod_compliance', 'mod_hr', 'mod_bi', 'mod_documents', 'mod_ai', 'feat_e_invoicing'
  ]),
  true
on conflict (company_id, flag_key) do nothing;
