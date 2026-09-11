-- When someone agreed to share health information (bodyweight, height, age,
-- sex, injury notes). Health information is sensitive information under the
-- Privacy Act, and collecting it needs consent; this is the record that it
-- was given. Null means consent hasn't been given, or has been withdrawn —
-- in which case those fields are cleared too.

alter table public.profiles
  add column if not exists health_consent_at timestamptz;
