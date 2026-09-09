-- Stores the generated training plan. The plan is read and written as a whole
-- rather than queried inside, so it lives as a single jsonb document.

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- One active plan per user: the newest row wins, older ones are history.
create index if not exists plans_user_created_idx
  on public.plans (user_id, created_at desc);

alter table public.plans enable row level security;

drop policy if exists "Users can view own plans" on public.plans;
create policy "Users can view own plans"
  on public.plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own plans" on public.plans;
create policy "Users can insert own plans"
  on public.plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own plans" on public.plans;
create policy "Users can update own plans"
  on public.plans for update
  using (auth.uid() = user_id);
