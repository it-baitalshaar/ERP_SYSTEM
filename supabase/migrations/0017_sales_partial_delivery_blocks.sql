-- Partial sales delivery, line payment tracking, customer product reservations/blocks

-- ---------------------------------------------------------------------------
-- Invoice: qty paid per line (item_id → qty) for partial payment / delivery
-- ---------------------------------------------------------------------------
alter table public.tax_invoices
  add column if not exists paid_line_qty jsonb not null default '{}'::jsonb;

comment on column public.tax_invoices.paid_line_qty is
  'Map of item_id → cumulative qty paid; enables partial delivery against payment';

-- ---------------------------------------------------------------------------
-- Customer product blocks (reservations / hold for a customer until a date)
-- ---------------------------------------------------------------------------
create table if not exists public.customer_product_blocks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  warehouse_id uuid references public.warehouses(id),
  qty numeric(15,3) not null check (qty > 0),
  blocked_until timestamptz not null,
  status text not null default 'active'
    check (status in ('active', 'expired', 'released')),
  reason text,
  invoice_id uuid references public.tax_invoices(id) on delete set null,
  sales_order_id uuid references public.sales_orders(id) on delete set null,
  whatsapp_reminder boolean not null default true,
  reminder_sent_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  released_at timestamptz
);

create index if not exists customer_product_blocks_company_idx
  on public.customer_product_blocks (company_id, status, blocked_until);
create index if not exists customer_product_blocks_customer_idx
  on public.customer_product_blocks (customer_id, item_id, status);
create index if not exists customer_product_blocks_item_idx
  on public.customer_product_blocks (item_id, status) where status = 'active';

comment on table public.customer_product_blocks is
  'Reserve/hold stock for a customer until blocked_until; history kept when expired/released';

alter table public.customer_product_blocks disable row level security;
