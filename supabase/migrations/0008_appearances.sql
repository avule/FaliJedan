-- Confirm appearances for a slot.
-- Organizer passes a list of {player_id, showed_up}.
-- For each player who didn't show: log no_show, recompute count_30d,
-- decay reliability, possibly ban.
--
-- Thresholds (from spec):
--   1 no_show in 30d  → -10 reliability (warning)
--   2 no_show in 30d  → -10 (still red flag, score < 70)
--   3 no_show in 30d  → soft ban (no DB enforcement, just last-priority flag)
--   4+ no_show in 30d → hard ban 14 days

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

    -- Upsert appearance
    insert into appearances (slot_id, player_id, showed_up, confirmed_at)
    values (p_slot_id, v_player, v_showed, now())
    on conflict (slot_id, player_id)
      do update set showed_up = excluded.showed_up,
                    confirmed_at = excluded.confirmed_at;

    if not v_showed then
      -- Log the no-show (idempotent: skip if already logged for this slot)
      insert into no_show_log (player_id, slot_id, type)
      select v_player, p_slot_id, 'no_show'
      where not exists (
        select 1 from no_show_log
        where player_id = v_player and slot_id = p_slot_id and type = 'no_show'
      );

      -- Count no-shows in last 30 days
      select count(*) into v_count_30d
      from no_show_log
      where player_id = v_player
        and type in ('no_show', 'late_cancel')
        and created_at > now() - interval '30 days';

      update players
      set no_show_count_30d = v_count_30d,
          reliability_score = greatest(0, 100 - (v_count_30d * 10))
      where id = v_player;

      -- Hard ban at 4+
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

  -- Mark slot as done
  update slots set status = 'done' where id = p_slot_id;
end;
$$;

grant execute on function public.confirm_appearances(uuid, jsonb) to authenticated;

-- Helper: kick an application (organizer removes a player)
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
    -- Promote first waitlist
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
