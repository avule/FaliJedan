-- gejmifikacija: xp, leveli, streak, bedzevi, rang lista.
-- gradi se povrh postojece pouzdanosti, nju ne diram, samo dodajem brojace.
-- pisanje ide kroz security definer funkcije, citanje novih tabela je javno.

-- nove kolone na players (brojaci)
alter table players add column if not exists xp          int not null default 0;
alter table players add column if not exists level       int not null default 1;
alter table players add column if not exists streak      int not null default 0;
alter table players add column if not exists best_streak int not null default 0;
alter table players add column if not exists attended    int not null default 0;
alter table players add column if not exists organized   int not null default 0;

create index if not exists players_city_xp_idx on players(city_id, xp desc);

-- xp dogadjaji, trag svake dodjele
create table if not exists xp_events (
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  type       text not null,  -- match_played | match_organized | slot_filled | first_sport | streak_bonus
  amount     int  not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists xp_events_player_idx on xp_events(player_id, created_at);

-- otkljucani bedzevi
create table if not exists user_badges (
  player_id uuid not null references players(id) on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  primary key (player_id, badge_key)
);

-- rls: citanje javno, upis samo kroz funkcije
alter table xp_events   enable row level security;
alter table user_badges enable row level security;

drop policy if exists xp_events_read on xp_events;
create policy xp_events_read on xp_events for select using (true);

drop policy if exists user_badges_read on user_badges;
create policy user_badges_read on user_badges for select using (true);
-- nema upis policy, pise samo award_xp / evaluate_badges

-- level iz xp-a, mora da se poklapa sa lib/gamification.ts. prelaz sa L: 500+(L-1)*250
create or replace function public.level_from_xp(p_xp int)
returns int
language plpgsql
immutable
as $$
declare
  v_level int := 1;
  v_rem   int := greatest(0, p_xp);
  v_req   int;
begin
  loop
    v_req := 500 + (v_level - 1) * 250;
    exit when v_rem < v_req;
    v_rem := v_rem - v_req;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;

-- dodjela xp-a: upise dogadjaj i osvjezi zbir na igracu
create or replace function public.award_xp(
  p_player uuid,
  p_type   text,
  p_amount int,
  p_meta   jsonb default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into xp_events (player_id, type, amount, meta)
  values (p_player, p_type, p_amount, p_meta);

  update players
  set xp = xp + p_amount,
      level = level_from_xp(xp + p_amount)
  where id = p_player;
end;
$$;

-- procjena bedzeva, dodaje novostecene (idempotentno)
create or replace function public.evaluate_badges(p_player uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_rel  int;
  v_att  int;
  v_org  int;
  v_best int;
  v_xp   int;
  v_city int;
  v_max_sport int;
  v_rank int;
begin
  select reliability_score, attended, organized, best_streak, xp, city_id
    into v_rel, v_att, v_org, v_best, v_xp, v_city
  from players where id = p_player;

  -- debi: prvi mec
  if v_att >= 1 then
    insert into user_badges(player_id, badge_key) values (p_player, 'debi')
    on conflict do nothing;
  end if;

  -- streak x10: najduzi niz >= 10
  if v_best >= 10 then
    insert into user_badges(player_id, badge_key) values (p_player, 'streak_10')
    on conflict do nothing;
  end if;

  -- pouzdan: 100% uz bar 5 odigranih
  if v_att >= 5 and v_rel = 100 then
    insert into user_badges(player_id, badge_key) values (p_player, 'reliable_100')
    on conflict do nothing;
  end if;

  -- organizator: 5+ zavrsenih slotova
  if v_org >= 5 then
    insert into user_badges(player_id, badge_key) values (p_player, 'organizer_5')
    on conflict do nothing;
  end if;

  -- maestro: 20+ meceva u jednom sportu
  select coalesce(max(cnt), 0) into v_max_sport from (
    select count(*) cnt
    from appearances a
    join slots s on s.id = a.slot_id
    where a.player_id = p_player and a.showed_up
    group by s.sport
  ) t;
  if v_max_sport >= 20 then
    insert into user_badges(player_id, badge_key) values (p_player, 'maestro')
    on conflict do nothing;
  end if;

  -- top 3: medju prva tri u gradu po xp-u (ako ima xp-a)
  if v_xp > 0 and v_city is not null then
    select count(*) + 1 into v_rank
    from players p2
    where p2.city_id = v_city and p2.xp > v_xp;
    if v_rank <= 3 then
      insert into user_badges(player_id, badge_key) values (p_player, 'top3')
      on conflict do nothing;
    end if;
  end if;
end;
$$;

-- kacim xp na postojece funkcije. obje su preslikane iz 0001 + xp dodatak,
-- stara logika (kapacitet, ban, pouzdanost, waitlist) je netaknuta.

-- apply_to_slot: kad se slot popuni, organizator dobija xp
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
  v_became_full bool := false;
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

    v_became_full := (v_slot.filled_spots + 1 >= v_slot.total_spots);

    update slots
    set filled_spots = filled_spots + 1,
        status = case
          when filled_spots + 1 >= total_spots then 'full'::slot_status_t
          else status
        end
    where id = p_slot_id;

    -- slot upravo popunjen -> xp organizatoru
    if v_became_full then
      perform award_xp(v_slot.organizer_id, 'slot_filled', 40,
        jsonb_build_object('slotId', p_slot_id));
    end if;
  else
    v_status := 'waitlist';
    insert into applications (slot_id, player_id, status)
    values (p_slot_id, v_uid, 'waitlist');
  end if;

  return v_status;
end;
$$;

grant execute on function public.apply_to_slot(uuid) to authenticated;

-- confirm_appearances: stara pouzdanost/ban + xp, streak, brojaci, bedzevi
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
  v_uid        uuid := auth.uid();
  v_slot       slots%rowtype;
  v_entry      jsonb;
  v_player     uuid;
  v_showed     bool;
  v_count_30d  int;
  v_new_streak int;
  v_first_in_sport bool;
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
      -- stara logika: no-show, pad pouzdanosti, ban
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

      -- nepojavljivanje resetuje streak
      update players
      set no_show_count_30d = v_count_30d,
          reliability_score = greatest(0, 100 - (v_count_30d * 10)),
          streak = 0
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
    else
      -- pojavio se -> xp, streak, brojaci
      update players
      set attended = attended + 1,
          streak = streak + 1,
          best_streak = greatest(best_streak, streak + 1)
      where id = v_player
      returning streak into v_new_streak;

      perform award_xp(v_player, 'match_played', 100,
        jsonb_build_object('slotId', p_slot_id, 'sport', v_slot.sport));

      -- prvi mec u ovom sportu (bez ovog slota)
      select not exists (
        select 1 from appearances a
        join slots s on s.id = a.slot_id
        where a.player_id = v_player and a.showed_up
          and s.sport = v_slot.sport and a.slot_id <> p_slot_id
      ) into v_first_in_sport;
      if v_first_in_sport then
        perform award_xp(v_player, 'first_sport', 50,
          jsonb_build_object('sport', v_slot.sport));
      end if;

      -- bonus na svaki peti u nizu
      if v_new_streak % 5 = 0 then
        perform award_xp(v_player, 'streak_bonus', 50,
          jsonb_build_object('streak', v_new_streak));
      end if;

      perform evaluate_badges(v_player);
    end if;
  end loop;

  -- slot zavrsen -> xp organizatoru i broji se organizovan mec
  update players set organized = organized + 1 where id = v_slot.organizer_id;
  perform award_xp(v_slot.organizer_id, 'match_organized', 60,
    jsonb_build_object('slotId', p_slot_id));
  perform evaluate_badges(v_slot.organizer_id);

  update slots set status = 'done' where id = p_slot_id;
end;
$$;

grant execute on function public.confirm_appearances(uuid, jsonb) to authenticated;

-- backfill brojaca iz appearances ako vec ima odigranih meceva.
-- xp se ne dodjeljuje retroaktivno, samo brojaci da profili ne krenu od nule.
update players p set
  attended = coalesce((
    select count(*) from appearances a where a.player_id = p.id and a.showed_up
  ), 0),
  organized = coalesce((
    select count(*) from slots s where s.organizer_id = p.id and s.status = 'done'
  ), 0);
