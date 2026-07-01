-- Procurement child documents: branch_id for document-scope filtering (matches LPO branch)

-- ---------------------------------------------------------------------------
-- Proforma invoices
-- ---------------------------------------------------------------------------
alter table public.proforma_invoices
  add column if not exists branch_id uuid references public.branches(id);

update public.proforma_invoices p
set branch_id = po.branch_id
from public.purchase_orders po
where p.purchase_order_id = po.id
  and p.branch_id is null;

-- ---------------------------------------------------------------------------
-- Supplier delivery notes
-- ---------------------------------------------------------------------------
alter table public.supplier_delivery_notes
  add column if not exists branch_id uuid references public.branches(id);

update public.supplier_delivery_notes s
set branch_id = po.branch_id
from public.purchase_orders po
where s.purchase_order_id = po.id
  and s.branch_id is null;

-- ---------------------------------------------------------------------------
-- Material receipt notes (MRN)
-- ---------------------------------------------------------------------------
alter table public.material_receipt_notes
  add column if not exists branch_id uuid references public.branches(id);

update public.material_receipt_notes m
set branch_id = po.branch_id
from public.purchase_orders po
where m.purchase_order_id = po.id
  and m.branch_id is null;

-- ---------------------------------------------------------------------------
-- Purchase payments (branch from linked invoice or LPO)
-- ---------------------------------------------------------------------------
alter table public.purchase_payments
  add column if not exists branch_id uuid references public.branches(id);

update public.purchase_payments pp
set branch_id = si.branch_id
from public.supplier_invoices si
where pp.supplier_invoice_id = si.id
  and pp.branch_id is null;

update public.purchase_payments pp
set branch_id = po.branch_id
from public.purchase_orders po
where pp.purchase_order_id = po.id
  and pp.branch_id is null;

create index if not exists proforma_invoices_branch_idx
  on public.proforma_invoices (company_id, branch_id, date desc);
create index if not exists supplier_delivery_notes_branch_idx
  on public.supplier_delivery_notes (company_id, branch_id, date desc);
create index if not exists material_receipt_notes_branch_idx
  on public.material_receipt_notes (company_id, branch_id, date desc);
