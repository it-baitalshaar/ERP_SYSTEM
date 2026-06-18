-- Per-user module grants (extra access beyond role defaults).

create table if not exists public.user_module_permissions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null,
  actions text[] not null default '{view,create,edit}',
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (user_id, module_key)
);

create index if not exists user_module_permissions_user_idx
  on public.user_module_permissions (user_id);

alter table public.user_module_permissions disable row level security;
