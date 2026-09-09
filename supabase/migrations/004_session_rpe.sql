-- Effort ratings were collected after every exercise and then discarded.
-- Progression needs them: hitting the top of a rep range at RPE 10 means
-- hold the weight, while the same reps at RPE 7 means add some.

alter table public.workout_sessions
  add column if not exists rpe jsonb not null default '{}'::jsonb;
