-- pocetna sema. pokrenuti jednom na praznoj bazi.

-- ekstenzije
create extension if not exists "pgcrypto";

-- enumi
do $$ begin
  create type level_t as enum ('casual', 'mid', 'competitive');
exception when duplicate_object then null; end $$;

do $$ begin
  create type slot_status_t as enum ('open', 'full', 'cancelled', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status_t as enum ('pending', 'accepted', 'rejected', 'waitlist');
exception when duplicate_object then null; end $$;

do $$ begin
  create type no_show_type_t as enum ('no_show', 'late_cancel', 'early_cancel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ban_type_t as enum ('soft', 'hard');
exception when duplicate_object then null; end $$;

-- staticke tabele (drzave, gradovi)
create table if not exists countries (
  id   serial primary key,
  name text not null unique,
  code text not null unique
);

create table if not exists cities (
  id         serial primary key,
  country_id int not null references countries(id) on delete cascade,
  name       text not null,
  unique (country_id, name)
);

-- igraci
create table if not exists players (
  id                 uuid primary key references auth.users(id) on delete cascade,
  name               text not null default '',
  country_id         int  references countries(id),
  city_id            int  references cities(id),
  sports             text[] not null default '{}',
  level              level_t,
  avatar_url         text,
  reliability_score  int  not null default 100,
  no_show_count_30d  int  not null default 0,
  ban_until          timestamptz,
  created_at         timestamptz not null default now()
);

create index if not exists players_city_idx on players(city_id);

-- napravi player red automatski pri registraciji
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.players (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- slotovi (termini)
create table if not exists slots (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references players(id) on delete cascade,
  sport         text not null,
  title         text not null,
  description   text,
  location_name text not null,
  lat           double precision not null,
  lng           double precision not null,
  city_id       int  not null references cities(id),
  scheduled_at  timestamptz not null,
  total_spots   int  not null check (total_spots > 0),
  filled_spots  int  not null default 0 check (filled_spots >= 0),
  level         level_t not null,
  status        slot_status_t not null default 'open',
  created_at    timestamptz not null default now()
);

create index if not exists slots_city_status_idx on slots(city_id, status, scheduled_at);
create index if not exists slots_organizer_idx on slots(organizer_id);

-- prijave
create table if not exists applications (
  id         uuid primary key default gen_random_uuid(),
  slot_id    uuid not null references slots(id) on delete cascade,
  player_id  uuid not null references players(id) on delete cascade,
  status     application_status_t not null default 'pending',
  applied_at timestamptz not null default now(),
  unique (slot_id, player_id)
);

create index if not exists applications_player_idx on applications(player_id);
create index if not exists applications_slot_idx on applications(slot_id);

-- pojave
create table if not exists appearances (
  slot_id      uuid not null references slots(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  showed_up    bool not null,
  confirmed_at timestamptz not null default now(),
  primary key (slot_id, player_id)
);

-- log nepojavljivanja
create table if not exists no_show_log (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  slot_id    uuid not null references slots(id) on delete cascade,
  type       no_show_type_t not null,
  created_at timestamptz not null default now()
);

create index if not exists no_show_log_player_idx on no_show_log(player_id, created_at);

-- banovi
create table if not exists bans (
  id             uuid primary key default gen_random_uuid(),
  player_id      uuid not null references players(id) on delete cascade,
  type           ban_type_t not null,
  reason         text,
  starts_at      timestamptz not null default now(),
  ends_at        timestamptz not null,
  no_show_count  int not null default 0
);

create index if not exists bans_player_active_idx on bans(player_id, ends_at);

-- chat
create table if not exists slot_chat (
  id         uuid primary key default gen_random_uuid(),
  slot_id    uuid not null references slots(id) on delete cascade,
  sender_id  uuid not null references players(id) on delete cascade,
  content    text not null check (length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists slot_chat_slot_idx on slot_chat(slot_id, created_at);

-- availability (nikad korisceno, brise se u 0008)
create table if not exists availability (
  player_id uuid not null references players(id) on delete cascade,
  date      date not null,
  time_from time not null,
  time_to   time not null,
  sports    text[] not null default '{}',
  primary key (player_id, date, time_from)
);

-- helper za citanje chata. rls radi bolje preko ove funkcije nego preko
-- cross-table exists (zbog realtime-a)
create or replace function public.can_access_slot_chat(p_slot_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    exists (
      select 1 from slots
      where id = p_slot_id and organizer_id = auth.uid()
    )
    or exists (
      select 1 from applications
      where slot_id = p_slot_id
        and player_id = auth.uid()
        and status = 'accepted'
    );
$$;

-- rls
alter table countries     enable row level security;
alter table cities        enable row level security;
alter table players       enable row level security;
alter table slots         enable row level security;
alter table applications  enable row level security;
alter table appearances   enable row level security;
alter table no_show_log   enable row level security;
alter table bans          enable row level security;
alter table slot_chat     enable row level security;
alter table availability  enable row level security;

drop policy if exists countries_read on countries;
create policy countries_read on countries for select using (true);

drop policy if exists cities_read on cities;
create policy cities_read on cities for select using (true);

-- igraci
drop policy if exists players_read on players;
create policy players_read on players for select using (true);

drop policy if exists players_insert_self on players;
create policy players_insert_self on players
  for insert with check (auth.uid() = id);

drop policy if exists players_update_self on players;
create policy players_update_self on players
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- slotovi
drop policy if exists slots_read on slots;
create policy slots_read on slots for select using (true);

drop policy if exists slots_insert_organizer on slots;
create policy slots_insert_organizer on slots
  for insert with check (auth.uid() = organizer_id);

drop policy if exists slots_update_organizer on slots;
create policy slots_update_organizer on slots
  for update using (auth.uid() = organizer_id) with check (auth.uid() = organizer_id);

drop policy if exists slots_delete_organizer on slots;
create policy slots_delete_organizer on slots
  for delete using (auth.uid() = organizer_id);

-- prijave
drop policy if exists applications_read on applications;
create policy applications_read on applications for select using (
  auth.uid() = player_id
  or exists (
    select 1 from slots s where s.id = slot_id and s.organizer_id = auth.uid()
  )
);

drop policy if exists applications_insert_self on applications;
create policy applications_insert_self on applications
  for insert with check (auth.uid() = player_id);

drop policy if exists applications_update on applications;
create policy applications_update on applications
  for update using (
    auth.uid() = player_id
    or exists (
      select 1 from slots s where s.id = slot_id and s.organizer_id = auth.uid()
    )
  );

drop policy if exists applications_delete_self on applications;
create policy applications_delete_self on applications
  for delete using (auth.uid() = player_id);

-- pojave
drop policy if exists appearances_read on appearances;
create policy appearances_read on appearances for select using (true);

drop policy if exists appearances_write_organizer on appearances;
create policy appearances_write_organizer on appearances
  for insert with check (
    exists (select 1 from slots s where s.id = slot_id and s.organizer_id = auth.uid())
  );

drop policy if exists appearances_update_organizer on appearances;
create policy appearances_update_organizer on appearances
  for update using (
    exists (select 1 from slots s where s.id = slot_id and s.organizer_id = auth.uid())
  );

-- no_show_log / bans: pise service role, igrac cita svoje
drop policy if exists no_show_log_read_self on no_show_log;
create policy no_show_log_read_self on no_show_log
  for select using (auth.uid() = player_id);

drop policy if exists bans_read_self on bans;
create policy bans_read_self on bans
  for select using (auth.uid() = player_id);

-- chat: citanje kroz security definer helper (realtime-friendly)
drop policy if exists slot_chat_read on slot_chat;
create policy slot_chat_read on slot_chat
  for select using (public.can_access_slot_chat(slot_id));

-- upis preko inline exists
drop policy if exists slot_chat_write on slot_chat;
create policy slot_chat_write on slot_chat
  for insert with check (
    auth.uid() = sender_id
    and (
      exists (
        select 1 from slots s
        where s.id = slot_chat.slot_id and s.organizer_id = auth.uid()
      )
      or exists (
        select 1 from applications a
        where a.slot_id = slot_chat.slot_id
          and a.player_id = auth.uid()
          and a.status = 'accepted'
      )
    )
  );

-- availability
drop policy if exists availability_read_self on availability;
create policy availability_read_self on availability
  for select using (auth.uid() = player_id);

drop policy if exists availability_write_self on availability;
create policy availability_write_self on availability
  for all using (auth.uid() = player_id) with check (auth.uid() = player_id);

-- grantovi, bez ovoga rls ne radi na praznom projektu
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;

grant execute on function public.can_access_slot_chat(uuid) to authenticated;

-- realtime publikacija
do $$ begin
  alter publication supabase_realtime add table slots;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table slot_chat;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table applications;
exception when duplicate_object then null; end $$;

-- funkcije

-- prijava na slot. atomicno uz zakljucavanje reda da se ne prebukira
create or replace function public.apply_to_slot(p_slot_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_slot      slots%rowtype;
  v_existing  application_status_t;
  v_active_ban_count int;
  v_status    text;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select count(*) into v_active_ban_count
  from bans
  where player_id = v_uid
    and type = 'hard'
    and ends_at > now();
  if v_active_ban_count > 0 then raise exception 'banned'; end if;

  select * into v_slot from slots where id = p_slot_id for update;
  if not found then raise exception 'slot_not_found'; end if;

  if v_slot.organizer_id = v_uid then raise exception 'cannot_apply_own'; end if;
  if v_slot.status in ('cancelled', 'done') then raise exception 'slot_closed'; end if;

  select status into v_existing
  from applications
  where slot_id = p_slot_id and player_id = v_uid;
  if found then raise exception 'already_applied'; end if;

  if v_slot.filled_spots < v_slot.total_spots then
    v_status := 'accepted';
    insert into applications (slot_id, player_id, status)
    values (p_slot_id, v_uid, 'accepted');

    update slots
    set filled_spots = filled_spots + 1,
        status = case
          when filled_spots + 1 >= total_spots then 'full'::slot_status_t
          else status
        end
    where id = p_slot_id;
  else
    v_status := 'waitlist';
    insert into applications (slot_id, player_id, status)
    values (p_slot_id, v_uid, 'waitlist');
  end if;

  return v_status;
end;
$$;

grant execute on function public.apply_to_slot(uuid) to authenticated;

-- odjava sa slota. promovise prvog sa waitliste ako se oslobodi mjesto.
-- kasna odjava (<2h prije) ide u log i spusta pouzdanost
create or replace function public.withdraw_from_slot(p_slot_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_slot         slots%rowtype;
  v_app          applications%rowtype;
  v_next         applications%rowtype;
  v_hours        numeric;
  v_was_accepted bool;
  v_late         bool;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_slot from slots where id = p_slot_id for update;
  if not found then raise exception 'slot_not_found'; end if;

  select * into v_app from applications
   where slot_id = p_slot_id and player_id = v_uid;
  if not found then raise exception 'not_applied'; end if;

  v_was_accepted := v_app.status = 'accepted';
  v_hours := extract(epoch from (v_slot.scheduled_at - now())) / 3600;
  v_late := v_was_accepted and v_hours < 2 and v_hours > 0;

  delete from applications where id = v_app.id;

  if v_was_accepted then
    select * into v_next from applications
     where slot_id = p_slot_id and status = 'waitlist'
     order by applied_at asc limit 1;

    if found then
      update applications set status = 'accepted' where id = v_next.id;
    else
      update slots
      set filled_spots = greatest(0, filled_spots - 1),
          status = case
            when status = 'full'::slot_status_t then 'open'::slot_status_t
            else status
          end
      where id = p_slot_id;
    end if;
  end if;

  if v_late then
    insert into no_show_log (player_id, slot_id, type)
    values (v_uid, p_slot_id, 'late_cancel');

    update players
    set reliability_score = greatest(0, reliability_score - 3)
    where id = v_uid;
  end if;

  return json_build_object('late', v_late, 'was_accepted', v_was_accepted);
end;
$$;

grant execute on function public.withdraw_from_slot(uuid) to authenticated;

-- potvrda pojava poslije meca. loguje no-show, spusta pouzdanost, banuje na 4+ u 30 dana
create or replace function public.confirm_appearances(
  p_slot_id uuid,
  p_entries jsonb -- [{ player_id: uuid, showed_up: bool }, ...]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid       uuid := auth.uid();
  v_slot      slots%rowtype;
  v_entry     jsonb;
  v_player    uuid;
  v_showed    bool;
  v_count_30d int;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_slot from slots where id = p_slot_id;
  if not found then raise exception 'slot_not_found'; end if;
  if v_slot.organizer_id <> v_uid then raise exception 'not_organizer'; end if;

  for v_entry in select * from jsonb_array_elements(p_entries) loop
    v_player := (v_entry->>'player_id')::uuid;
    v_showed := (v_entry->>'showed_up')::bool;

    insert into appearances (slot_id, player_id, showed_up, confirmed_at)
    values (p_slot_id, v_player, v_showed, now())
    on conflict (slot_id, player_id)
      do update set showed_up = excluded.showed_up,
                    confirmed_at = excluded.confirmed_at;

    if not v_showed then
      insert into no_show_log (player_id, slot_id, type)
      select v_player, p_slot_id, 'no_show'
      where not exists (
        select 1 from no_show_log
        where player_id = v_player and slot_id = p_slot_id and type = 'no_show'
      );

      select count(*) into v_count_30d
      from no_show_log
      where player_id = v_player
        and type in ('no_show', 'late_cancel')
        and created_at > now() - interval '30 days';

      update players
      set no_show_count_30d = v_count_30d,
          reliability_score = greatest(0, 100 - (v_count_30d * 10))
      where id = v_player;

      if v_count_30d >= 4 then
        insert into bans (player_id, type, reason, ends_at, no_show_count)
        values (
          v_player,
          'hard',
          '4+ no-shows u 30 dana',
          now() + interval '14 days',
          v_count_30d
        );
        update players set ban_until = now() + interval '14 days' where id = v_player;
      end if;
    end if;
  end loop;

  update slots set status = 'done' where id = p_slot_id;
end;
$$;

grant execute on function public.confirm_appearances(uuid, jsonb) to authenticated;

-- organizator izbacuje igraca. promovise prvog sa waitliste ako je bio accepted
create or replace function public.kick_from_slot(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_app    applications%rowtype;
  v_slot   slots%rowtype;
  v_next   applications%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_app from applications where id = p_application_id;
  if not found then raise exception 'application_not_found'; end if;

  select * into v_slot from slots where id = v_app.slot_id for update;
  if v_slot.organizer_id <> v_uid then raise exception 'not_organizer'; end if;

  delete from applications where id = p_application_id;

  if v_app.status = 'accepted' then
    select * into v_next from applications
    where slot_id = v_slot.id and status = 'waitlist'
    order by applied_at asc limit 1;

    if found then
      update applications set status = 'accepted' where id = v_next.id;
    else
      update slots
      set filled_spots = greatest(0, filled_spots - 1),
          status = case when status = 'full'::slot_status_t
                        then 'open'::slot_status_t
                        else status end
      where id = v_slot.id;
    end if;
  end if;
end;
$$;

grant execute on function public.kick_from_slot(uuid) to authenticated;

-- seed: drzave i veci gradovi
insert into countries (name, code) values
  ('Bosna i Hercegovina', 'BA'),
  ('Srbija', 'RS'),
  ('Hrvatska', 'HR'),
  ('Crna Gora', 'ME'),
  ('Sjeverna Makedonija', 'MK')
on conflict (code) do nothing;

insert into cities (country_id, name)
select c.id, x.name from countries c
join (values
  ('BA', 'Sarajevo'), ('BA', 'Banja Luka'), ('BA', 'Mostar'), ('BA', 'Tuzla'), ('BA', 'Zenica'),
  ('RS', 'Beograd'), ('RS', 'Novi Sad'), ('RS', 'Niš'), ('RS', 'Kragujevac'), ('RS', 'Subotica'),
  ('HR', 'Zagreb'), ('HR', 'Split'), ('HR', 'Rijeka'), ('HR', 'Osijek'), ('HR', 'Zadar'),
  ('ME', 'Podgorica'), ('ME', 'Nikšić'), ('ME', 'Budva'), ('ME', 'Bar'),
  ('MK', 'Skoplje'), ('MK', 'Bitola'), ('MK', 'Kumanovo'), ('MK', 'Tetovo')
) x(code, name) on c.code = x.code
on conflict (country_id, name) do nothing;
