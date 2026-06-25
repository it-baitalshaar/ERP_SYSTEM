-- Per-company document print/PDF template settings (LPO classic, standard quote/invoice)

do $$ begin
  create type public.document_template_style as enum ('classic_lpo', 'standard');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Company document template settings (one row per shop company)
-- ---------------------------------------------------------------------------
create table if not exists public.company_document_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  logo_url text,
  company_name_ar text,
  phone text,
  email text,
  footer_phone text,
  procurement_template public.document_template_style not null default 'classic_lpo',
  sales_template public.document_template_style not null default 'standard',
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

comment on table public.company_document_settings is
  'Admin-customizable print templates: logo, doc naming, LPO/quote layout';
comment on column public.company_document_settings.doc_titles is
  'Partial map of docType key → custom header title (see DocumentTitleKey in app)';

drop trigger if exists company_document_settings_updated_at on public.company_document_settings;
create trigger company_document_settings_updated_at
  before update on public.company_document_settings
  for each row execute function public.set_updated_at();
