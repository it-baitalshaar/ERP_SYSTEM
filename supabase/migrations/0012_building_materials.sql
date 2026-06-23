-- Building materials: item cost/sale pricing, supplier balance, MRN LPO variance approval

alter table public.items
  add column if not exists cost_price numeric(15,2) not null default 0;

comment on column public.items.cost_price is 'Purchase / landed cost per base_uom';
comment on column public.items.unit_price is 'Selling price per base_uom';

alter table public.suppliers
  add column if not exists outstanding_balance numeric(15,2) not null default 0;

alter table public.material_receipt_notes
  add column if not exists lpo_price_variance boolean not null default false,
  add column if not exists variance_approved boolean not null default false,
  add column if not exists variance_approved_by uuid references public.profiles(id),
  add column if not exists variance_approved_at timestamptz;
