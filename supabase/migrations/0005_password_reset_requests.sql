-- Password reset requests (user submits → admin sets new password)

create table if not exists public.password_reset_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  email text not null,
  status text not null default 'pending',
  note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references public.profiles(id),
  constraint password_reset_requests_status_check
    check (status in ('pending', 'resolved', 'rejected'))
);

create index if not exists password_reset_requests_pending_idx
  on public.password_reset_requests (status, created_at desc)
  where status = 'pending';

alter table public.password_reset_requests disable row level security;
