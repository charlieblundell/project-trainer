-- Subscription state, kept apart from profiles on purpose.
--
-- Users can update their own profile row, so anything stored there is
-- something they can change from the browser console. Whether someone has
-- paid must not be one of those things. This table can be read by its owner
-- and written only by the server using the service role key, which Stripe's
-- verified webhook uses. There is no insert, update or delete policy for users.

create table if not exists public.billing (
  user_id uuid primary key references auth.users(id) on delete cascade,
  -- The free trial is tracked here rather than in Stripe, so nobody has to
  -- enter a card to start one.
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  price_id text,
  plan_interval text check (plan_interval is null or plan_interval in ('month', 'year')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.billing enable row level security;

drop policy if exists "Users can view own billing" on public.billing;
create policy "Users can view own billing"
  on public.billing for select
  using (auth.uid() = user_id);

-- Every new account gets a billing row, and with it a trial, at signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.billing (user_id) values (new.id);
  return new;
end;
$$;

-- Accounts that existed before billing did get a fresh fourteen days from
-- today, rather than a trial that expired before anyone could see it.
insert into public.billing (user_id, trial_ends_at)
select id, now() + interval '14 days'
from public.profiles
on conflict (user_id) do nothing;
