-- Answers to the optional pre-workout check-in (sleep, soreness, joint pain),
-- saved with the workout they applied to. This is health information, so it's
-- only recorded for people who have given health consent.

alter table public.workout_sessions
  add column if not exists readiness jsonb;

-- Withdrawing health consent has to be able to erase check-in answers from
-- past workouts, which means people need to be able to update their own rows.
-- Updating your own training log carries no risk to anyone else's data.
drop policy if exists "Users can update own workout sessions" on public.workout_sessions;
create policy "Users can update own workout sessions"
  on public.workout_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
