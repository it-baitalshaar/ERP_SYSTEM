-- Per-company document print/PDF template settings (LPO classic, standard quote/invoice)

create table if not exists public.company_document_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  logo_url text,
  company_name_ar text,
  phone text,
  email text,
  footer_phone text,
  procurement_template text not null default 'classic_lpo'
    check (procurement_template in ('classic_lpo', 'standard')),
  sales_template text not null default 'standard'
    check (sales_template in ('classic_lpo', 'standard')),
  doc_titles jsonb not null default '{}'::jsonb,
  show_amount_in_words boolean not null default true,
  show_vat_breakdown boolean not null default true,
  footer_notes text,
  terms_conditions text,
  signature_left_label text not null default 'Prepared by',
  signature_right_label text not null default 'Approved by',
  accent_color text not null default '#1e293b',
  updated_at timestamptz not null default now()
);

comment on table public.company_document_settings is 'Admin-customizable print templates: logo, doc naming, LPO/quote layout';

drop trigger if exists company_document_settings_updated_at on public.company_document_settings;
create trigger company_document_settings_updated_at
  before update on public.company_document_settings
  for each row execute function public.set_updated_at();
