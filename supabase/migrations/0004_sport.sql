-- sport "drugo" sa slobodnim nazivom. kad je sport='other', custom_sport drzi naziv

alter table slots
  add column if not exists custom_sport text;

alter table slots
  add constraint custom_sport_required_when_other
  check (
    (sport <> 'other') or (custom_sport is not null and length(trim(custom_sport)) between 2 and 50)
  )
  not valid;

-- provjeri postojece redove, nijedan nije 'other' pa prolazi
alter table slots validate constraint custom_sport_required_when_other;
