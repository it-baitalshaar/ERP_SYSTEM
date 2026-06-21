-- Inventory: items, stock levels, movements; sales delivery notes (stock out)

do $$ begin
  create type public.stock_movement_type as enum ('in', 'out', 'adjustment', 'transfer');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Item categories
-- ---------------------------------------------------------------------------
create table if not exists public.item_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  parent_id uuid references public.item_categories(id),
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

-- ---------------------------------------------------------------------------
-- Items / products (building materials catalog)
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.item_categories(id),
  sku text not null,
  name text not null,
  base_uom text not null default 'pcs',
  uom_conversions jsonb not null default '[]',
  is_batch_managed boolean not null default false,
  reorder_level numeric(15,3) not null default 0,
  unit_price numeric(15,2) not null default 0,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);

-- ---------------------------------------------------------------------------
-- Stock by warehouse
-- ---------------------------------------------------------------------------
create table if not exists public.stock_levels (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  qty_on_hand numeric(15,3) not null default 0,
  qty_reserved numeric(15,3) not null default 0,
  reorder_level numeric(15,3),
  updated_at timestamptz not null default now(),
  unique (item_id, warehouse_id)
);

-- ---------------------------------------------------------------------------
-- Stock movement audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  item_id uuid not null references public.items(id),
  warehouse_id uuid not null references public.warehouses(id),
  movement_type public.stock_movement_type not null,
  qty numeric(15,3) not null,
  reference_type text not null,
  reference_id uuid not null,
  reference_number text,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sales delivery notes (stock out)
-- ---------------------------------------------------------------------------
create table if not exists public.delivery_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  invoice_id uuid not null references public.tax_invoices(id),
  warehouse_id uuid references public.warehouses(id),
  number text not null,
  date date not null default current_date,
  status public.document_status not null default 'draft',
  lines jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (company_id, number)
);

create index if not exists items_company_idx on public.items (company_id, name);
create index if not exists stock_levels_company_idx on public.stock_levels (company_id);
create index if not exists stock_movements_ref_idx on public.stock_movements (reference_type, reference_id);
create index if not exists delivery_notes_company_idx on public.delivery_notes (company_id, date desc);

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

alter table public.item_categories disable row level security;
alter table public.items disable row level security;
alter table public.stock_levels disable row level security;
alter table public.stock_movements disable row level security;
alter table public.delivery_notes disable row level security;
