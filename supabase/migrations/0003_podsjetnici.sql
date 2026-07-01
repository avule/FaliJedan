-- da cron ne posalje isti 24h podsjetnik dva puta
alter table applications
  add column if not exists reminder_sent_at timestamptz;

create index if not exists applications_reminder_idx
  on applications(reminder_sent_at)
  where reminder_sent_at is null;
