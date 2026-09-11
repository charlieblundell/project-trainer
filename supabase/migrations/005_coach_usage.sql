-- Every coach message costs real money, so each request is recorded and
-- counted before the model is called. Without this, one account running a
-- script against /api/coach could run up an unbounded API bill.

create table if not exists public.coach_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists coach_usage_user_created_idx
  on public.coach_usage (user_id, created_at desc);

alter table public.coach_usage enable row level security;

drop policy if exists "Users can view own coach usage" on public.coach_usage;
create policy "Users can view own coach usage"
  on public.coach_usage for select
  using (auth.uid() = user_id);

drop policy if exists "Users can record own coach usage" on public.coach_usage;
create policy "Users can record own coach usage"
  on public.coach_usage for insert
  with check (auth.uid() = user_id);

-- Deliberately no update or delete policy: nobody should be able to wipe
-- their own count to get past the limit.
