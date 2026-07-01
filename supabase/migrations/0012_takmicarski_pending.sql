-- Fix: 0009_gamifikacija je prepisala apply_to_slot i time ponistila pravilo
-- iz 0005 da takmicarski slotovi idu na rucno odobravanje.
--
-- Pravilo:
-- - competitive: prijava ide u pending, filled_spots se ne dira
-- - casual/mid: automatski accepted do kapaciteta, pa waitlist

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

  if v_slot.level = 'competitive' then
    v_status := 'pending';
    insert into applications (slot_id, player_id, status)
    values (p_slot_id, v_uid, 'pending');
    return v_status;
  end if;

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

-- Competitive slotovi se pune kroz odobravanje, pa i tu treba dodijeliti
-- slot_filled XP ako odobrena prijava upravo popuni termin.
create or replace function public.approve_application(p_application_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_app    applications%rowtype;
  v_slot   slots%rowtype;
  v_status text;
  v_became_full bool := false;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_app from applications where id = p_application_id;
  if not found then raise exception 'application_not_found'; end if;
  if v_app.status <> 'pending' then raise exception 'not_pending'; end if;

  select * into v_slot from slots where id = v_app.slot_id for update;
  if v_slot.organizer_id <> v_uid then raise exception 'not_organizer'; end if;
  if v_slot.status in ('cancelled', 'done') then raise exception 'slot_closed'; end if;

  if v_slot.filled_spots < v_slot.total_spots then
    v_status := 'accepted';
    v_became_full := (v_slot.filled_spots + 1 >= v_slot.total_spots);

    update applications set status = 'accepted' where id = p_application_id;
    update slots
    set filled_spots = filled_spots + 1,
        status = case
          when filled_spots + 1 >= total_spots then 'full'::slot_status_t
          else status
        end
    where id = v_slot.id;

    if v_became_full then
      perform award_xp(v_slot.organizer_id, 'slot_filled', 40,
        jsonb_build_object('slotId', v_slot.id));
    end if;
  else
    v_status := 'waitlist';
    update applications set status = 'waitlist' where id = p_application_id;
  end if;

  return v_status;
end;
$$;

grant execute on function public.approve_application(uuid) to authenticated;
