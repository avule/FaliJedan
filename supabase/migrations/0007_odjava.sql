-- withdraw_from_slot sad vraca i ko je promovisan sa waitliste, da mu posaljemo
-- mejl "usao si". inace radi isto kao prije.

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
  v_promoted     uuid := null;
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
      v_promoted := v_next.player_id;
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

  return json_build_object(
    'late', v_late,
    'was_accepted', v_was_accepted,
    'promoted_player_id', v_promoted
  );
end;
$$;

grant execute on function public.withdraw_from_slot(uuid) to authenticated;


-- kick_from_slot isto promovise sa waitliste i vraca id promovisanog (ili null).
-- mijenja se povratni tip void -> uuid pa stara funkcija mora prvo da padne
-- (postgres ne da create or replace da promijeni return tip)
drop function if exists public.kick_from_slot(uuid);

create or replace function public.kick_from_slot(p_application_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_app      applications%rowtype;
  v_slot     slots%rowtype;
  v_next     applications%rowtype;
  v_promoted uuid := null;
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
      v_promoted := v_next.player_id;
    else
      update slots
      set filled_spots = greatest(0, filled_spots - 1),
          status = case when status = 'full'::slot_status_t
                        then 'open'::slot_status_t
                        else status end
      where id = v_slot.id;
    end if;
  end if;

  return v_promoted;
end;
$$;

grant execute on function public.kick_from_slot(uuid) to authenticated;
