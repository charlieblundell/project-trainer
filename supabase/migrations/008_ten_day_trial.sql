-- New accounts get a 10-day free trial instead of 14.
--
-- Only the default changes: every account that already exists keeps the
-- trial end date it was given, so nobody who has started a trial has it
-- shortened.

alter table public.billing
  alter column trial_ends_at set default (now() + interval '10 days');
