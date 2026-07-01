-- takmicarski slotovi: prijava ide u pending, organizator rucno odobrava.
-- casual/mid ostaju kao prije (primi do kapaciteta pa waitlist).

-- nova apply_to_slot, takmicarski ide kroz pending
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

  -- takmicarski ceka odobrenje, filled_spots se ne dira ovdje
  if v_slot.level = 'competitive' then
    v_status := 'pending';
    insert into applications (slot_id, player_id, status)
    values (p_slot_id, v_uid, 'pending');
    return v_status;
  end if;

  -- casual/mid: primi do kapaciteta, dalje waitlist
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


-- organizator odobrava pending prijavu. pending -> accepted (ili waitlist
-- ako se slot u medjuvremenu popunio)
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
    update applications set status = 'accepted' where id = p_application_id;
    update slots
    set filled_spots = filled_spots + 1,
        status = case
          when filled_spots + 1 >= total_spots then 'full'::slot_status_t
          else status
        end
    where id = v_slot.id;
  else
    -- popunilo se u medjuvremenu, ide na waitlist
    v_status := 'waitlist';
    update applications set status = 'waitlist' where id = p_application_id;
  end if;

  return v_status;
end;
$$;

grant execute on function public.approve_application(uuid) to authenticated;


-- organizator odbija pending prijavu. ne dira filled_spots
create or replace function public.reject_application(p_application_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_app  applications%rowtype;
  v_slot slots%rowtype;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;

  select * into v_app from applications where id = p_application_id;
  if not found then raise exception 'application_not_found'; end if;
  if v_app.status <> 'pending' then raise exception 'not_pending'; end if;

  select * into v_slot from slots where id = v_app.slot_id;
  if v_slot.organizer_id <> v_uid then raise exception 'not_organizer'; end if;

  update applications set status = 'rejected' where id = p_application_id;
end;
$$;

grant execute on function public.reject_application(uuid) to authenticated;
