-- Expands the onboarding questionnaire from 5 answers to 11 screens' worth.
-- Safe to re-run: every column is added only if missing.

alter table public.profiles add column if not exists equipment text[] not null default '{}';
alter table public.profiles add column if not exists liked_exercises text[] not null default '{}';
alter table public.profiles add column if not exists disliked_exercises text[] not null default '{}';
alter table public.profiles add column if not exists training_days text[] not null default '{}';
alter table public.profiles add column if not exists bodyweight_kg numeric;
alter table public.profiles add column if not exists age int;
alter table public.profiles add column if not exists height_cm numeric;
alter table public.profiles add column if not exists sex text;
alter table public.profiles add column if not exists considerations text;

-- Keep the free-text field to a sane length, and restrict sex to known values.
alter table public.profiles drop constraint if exists profiles_sex_check;
alter table public.profiles add constraint profiles_sex_check
  check (sex is null or sex in ('male', 'female', 'prefer_not_to_say'));

alter table public.profiles drop constraint if exists profiles_considerations_len;
alter table public.profiles add constraint profiles_considerations_len
  check (considerations is null or char_length(considerations) <= 2000);
