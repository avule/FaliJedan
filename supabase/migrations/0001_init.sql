-- FaliJedan — initial schema, RLS, triggers, seed.
-- Run in Supabase SQL Editor (full file, once).

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
create extension if not exists "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================
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

-- ============================================================================
-- STATIC TABLES
-- ============================================================================
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

-- ============================================================================
-- PLAYERS (extends auth.users)
-- ============================================================================
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

-- Auto-create player row on signup
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

-- ============================================================================
-- SLOTS
-- ============================================================================
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

-- ============================================================================
-- APPLICATIONS
-- ============================================================================
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

-- ============================================================================
-- APPEARANCES
-- ============================================================================
create table if not exists appearances (
  slot_id      uuid not null references slots(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  showed_up    bool not null,
  confirmed_at timestamptz not null default now(),
  primary key (slot_id, player_id)
);

-- ============================================================================
-- NO-SHOW LOG
-- ============================================================================
create table if not exists no_show_log (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  slot_id    uuid not null references slots(id) on delete cascade,
  type       no_show_type_t not null,
  created_at timestamptz not null default now()
);

create index if not exists no_show_log_player_idx on no_show_log(player_id, created_at);

-- ============================================================================
-- BANS
-- ============================================================================
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

-- ============================================================================
-- SLOT CHAT
-- ============================================================================
create table if not exists slot_chat (
  id         uuid primary key default gen_random_uuid(),
  slot_id    uuid not null references slots(id) on delete cascade,
  sender_id  uuid not null references players(id) on delete cascade,
  content    text not null check (length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists slot_chat_slot_idx on slot_chat(slot_id, created_at);

-- ============================================================================
-- AVAILABILITY
-- ============================================================================
create table if not exists availability (
  player_id uuid not null references players(id) on delete cascade,
  date      date not null,
  time_from time not null,
  time_to   time not null,
  sports    text[] not null default '{}',
  primary key (player_id, date, time_from)
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
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

-- Static reference tables: anyone reads
drop policy if exists countries_read on countries;
create policy countries_read on countries for select using (true);

drop policy if exists cities_read on cities;
create policy cities_read on cities for select using (true);

-- ----------------------------------------------------------------------------
-- PLAYERS: public read, owner writes
-- ----------------------------------------------------------------------------
drop policy if exists players_read on players;
create policy players_read on players for select using (true);

drop policy if exists players_insert_self on players;
create policy players_insert_self on players
  for insert with check (auth.uid() = id);

drop policy if exists players_update_self on players;
create policy players_update_self on players
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- SLOTS: anyone reads non-cancelled, organizer writes own
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- APPLICATIONS: player sees own, organizer sees apps to own slots
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- APPEARANCES: organizer of slot writes; everyone reads
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- NO_SHOW_LOG / BANS: server-side only (service role bypasses RLS)
-- Player can read own records.
-- ----------------------------------------------------------------------------
drop policy if exists no_show_log_read_self on no_show_log;
create policy no_show_log_read_self on no_show_log
  for select using (auth.uid() = player_id);

drop policy if exists bans_read_self on bans;
create policy bans_read_self on bans
  for select using (auth.uid() = player_id);

-- ----------------------------------------------------------------------------
-- SLOT_CHAT: only accepted players + organizer
-- ----------------------------------------------------------------------------
drop policy if exists slot_chat_read on slot_chat;
create policy slot_chat_read on slot_chat for select using (
  exists (select 1 from slots s where s.id = slot_id and s.organizer_id = auth.uid())
  or exists (
    select 1 from applications a
    where a.slot_id = slot_chat.slot_id
      and a.player_id = auth.uid()
      and a.status = 'accepted'
  )
);

drop policy if exists slot_chat_write on slot_chat;
create policy slot_chat_write on slot_chat
  for insert with check (
    auth.uid() = sender_id
    and (
      exists (select 1 from slots s where s.id = slot_id and s.organizer_id = auth.uid())
      or exists (
        select 1 from applications a
        where a.slot_id = slot_chat.slot_id
          and a.player_id = auth.uid()
          and a.status = 'accepted'
      )
    )
  );

-- ----------------------------------------------------------------------------
-- AVAILABILITY: owner only
-- ----------------------------------------------------------------------------
drop policy if exists availability_read_self on availability;
create policy availability_read_self on availability
  for select using (auth.uid() = player_id);

drop policy if exists availability_write_self on availability;
create policy availability_write_self on availability
  for all using (auth.uid() = player_id) with check (auth.uid() = player_id);

-- ============================================================================
-- REALTIME publication
-- ============================================================================
do $$ begin
  alter publication supabase_realtime add table slots;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table slot_chat;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table applications;
exception when duplicate_object then null; end $$;

-- ============================================================================
-- SEED: countries + major cities
-- ============================================================================
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
