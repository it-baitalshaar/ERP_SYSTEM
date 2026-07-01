-- Per-company workflow step overrides (procurement, sales, inventory)

create table if not exists public.company_workflow_settings (
  company_id uuid not null references public.companies(id) on delete cascade,
  module text not null,
  steps jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (company_id, module)
);

comment on table public.company_workflow_settings is
  'Admin workflow builder — step enable/approval overrides per module';
comment on column public.company_workflow_settings.steps is
  'Array of { step_key, enabled?, requires_approval?, approver_mode?, approver_role_id?, approver_user_id? }';

drop trigger if exists company_workflow_settings_updated_at on public.company_workflow_settings;
create trigger company_workflow_settings_updated_at
  before update on public.company_workflow_settings
  for each row execute function public.set_updated_at();
