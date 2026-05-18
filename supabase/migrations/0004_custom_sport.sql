-- Allow "Drugo" (other) sports with a free-text label.
-- When sport='other', custom_sport holds the user-typed sport name.

alter table slots
  add column if not exists custom_sport text;

alter table slots
  add constraint custom_sport_required_when_other
  check (
    (sport <> 'other') or (custom_sport is not null and length(trim(custom_sport)) between 2 and 50)
  )
  not valid;

-- Validate existing rows (none will fail since none use 'other' yet)
alter table slots validate constraint custom_sport_required_when_other;
