-- Backfill purchase_payments.branch_id for rows created before branch_id was set on insert

update public.purchase_payments pp
set branch_id = si.branch_id
from public.supplier_invoices si
where pp.supplier_invoice_id = si.id
  and pp.branch_id is null
  and si.branch_id is not null;

update public.purchase_payments pp
set branch_id = po.branch_id
from public.purchase_orders po
where pp.purchase_order_id = po.id
  and pp.branch_id is null
  and po.branch_id is not null;

update public.purchase_payments pp
set branch_id = sub.id
from (
  select distinct on (company_id) id, company_id
  from public.branches
  order by company_id, created_at
) sub
where pp.company_id = sub.company_id
  and pp.branch_id is null;

create index if not exists purchase_payments_branch_idx
  on public.purchase_payments (company_id, branch_id, date desc);
