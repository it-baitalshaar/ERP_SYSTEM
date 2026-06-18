-- Allow logging permanent entity deletions (e.g. branch removal).

alter table public.org_data_operations
  drop constraint if exists org_data_operations_action_check;

alter table public.org_data_operations
  add constraint org_data_operations_action_check
  check (action in ('export', 'reset', 'restore', 'delete'));
