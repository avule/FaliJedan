-- Atomic apply / withdraw via SECURITY DEFINER functions.
-- The function runs as table owner so it can update slots.filled_spots
-- regardless of the caller's RLS. Caller identity is taken from auth.uid().

-- ============================================================================
-- apply_to_slot(slot_id) → returns text status: 'accepted' | 'waitlist'
-- Errors out via raise exception on invalid state.
-- ============================================================================
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
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- Active hard ban?
  select count(*) into v_active_ban_count
  from bans
  where player_id = v_uid
    and type = 'hard'
    and ends_at > now();
  if v_active_ban_count > 0 then
    raise exception 'banned';
  end if;

  -- Lock the slot row to serialize concurrent applies
  select * into v_slot from slots where id = p_slot_id for update;
  if not found then
    raise exception 'slot_not_found';
  end if;

  if v_slot.organizer_id = v_uid then
    raise exception 'cannot_apply_own';
  end if;
  if v_slot.status in ('cancelled', 'done') then
    raise exception 'slot_closed';
  end if;

  -- Already applied?
  select status into v_existing
  from applications
  where slot_id = p_slot_id and player_id = v_uid;
  if found then
    raise exception 'already_applied';
  end if;

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

-- ============================================================================
-- withdraw_from_slot(slot_id) → returns json { late: bool, was_accepted: bool }
-- Promotes first waitlist applicant if a spot opens.
-- Logs late_cancel + reduces reliability if <2h before kickoff.
-- ============================================================================
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
    -- Try to promote first waitlist applicant
    select * into v_next from applications
     where slot_id = p_slot_id and status = 'waitlist'
     order by applied_at asc limit 1;

    if found then
      update applications set status = 'accepted' where id = v_next.id;
      -- filled_spots stays the same; status unchanged
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
