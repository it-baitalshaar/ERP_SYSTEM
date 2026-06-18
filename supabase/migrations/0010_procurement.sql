-- Procurement module: suppliers, material requests, LPO, proforma, delivery, MRN, supplier invoices, payments

do $$ begin
  create type public.purchase_payment_terms as enum ('advance', 'on_delivery', 'credit');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.purchase_payment_type as enum ('advance', 'on_delivery', 'partial', 'final', 'credit');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  payment_terms text not null default 'Net 30',
  classification text not null default 'local',
  currency text not null default 'AED',
  credit_days int not null default 30,
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 1. Material Request (authorize)
-- ---------------------------------------------------------------------------
create table if not exists public.material_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  requested_by uuid references public.profiles(id),
  warehouse_id uuid references public.warehouses(id),
  lines jsonb not null default '[]',
  total numeric(15,2) not null default 0,
  notes text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- 2. LPO (Purchase Order)
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  supplier_id uuid not null references public.suppliers(id),
  material_request_id uuid references public.material_requests(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  currency text not null default 'AED',
  payment_terms_type public.purchase_payment_terms not null default 'credit',
  lines jsonb not null default '[]',
  total numeric(15,2) not null default 0,
  expected_delivery date,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- 3. Proforma Invoice
-- ---------------------------------------------------------------------------
create table if not exists public.proforma_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  supplier_reference text,
  currency text not null default 'AED',
  lines jsonb not null default '[]',
  total numeric(15,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- 4. Supplier Delivery Note
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_delivery_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  carrier text,
  lines jsonb not null default '[]',
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- 5. MRN (Material Receipt Note) + price updation
-- ---------------------------------------------------------------------------
create table if not exists public.material_receipt_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id),
  delivery_note_id uuid references public.supplier_delivery_notes(id),
  warehouse_id uuid references public.warehouses(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  lines jsonb not null default '[]',
  price_updates jsonb not null default '[]',
  total numeric(15,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- 6. Supplier Tax Invoice
-- ---------------------------------------------------------------------------
create table if not exists public.supplier_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  supplier_id uuid not null references public.suppliers(id),
  purchase_order_id uuid references public.purchase_orders(id),
  mrn_id uuid references public.material_receipt_notes(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  lines jsonb not null default '[]',
  subtotal numeric(15,2) not null default 0,
  vat_amount numeric(15,2) not null default 0,
  total numeric(15,2) not null default 0,
  is_paid boolean not null default false,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

-- ---------------------------------------------------------------------------
-- 7. Purchase Payments
-- ---------------------------------------------------------------------------
create table if not exists public.purchase_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  purchase_order_id uuid references public.purchase_orders(id),
  supplier_invoice_id uuid references public.supplier_invoices(id),
  number text not null,
  date date not null default current_date,
  payment_type public.purchase_payment_type not null default 'final',
  status public.document_status not null default 'draft',
  amount numeric(15,2) not null default 0,
  currency text not null default 'AED',
  reference text,
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

create index if not exists material_requests_company_idx on public.material_requests (company_id, date desc);
create index if not exists purchase_orders_company_idx on public.purchase_orders (company_id, date desc);
create index if not exists suppliers_company_idx on public.suppliers (company_id, name);

alter table public.suppliers disable row level security;
alter table public.material_requests disable row level security;
alter table public.purchase_orders disable row level security;
alter table public.proforma_invoices disable row level security;
alter table public.supplier_delivery_notes disable row level security;
alter table public.material_receipt_notes disable row level security;
alter table public.supplier_invoices disable row level security;
alter table public.purchase_payments disable row level security;
