-- Profiles table: one row per user, holds onboarding answers
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  goal text,
  experience text,
  days int,
  length int,
  environment text,
  equipment text[] not null default '{}',
  liked_exercises text[] not null default '{}',
  disliked_exercises text[] not null default '{}',
  training_days text[] not null default '{}',
  bodyweight_kg numeric,
  age int,
  height_cm numeric,
  sex text check (sex is null or sex in ('male', 'female', 'prefer_not_to_say')),
  considerations text check (considerations is null or char_length(considerations) <= 2000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create a profile row whenever a new user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Workout history: one row per completed workout
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_id text not null,
  logged_sets jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;

create policy "Users can view own workout sessions"
  on public.workout_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own workout sessions"
  on public.workout_sessions for insert
  with check (auth.uid() = user_id);
