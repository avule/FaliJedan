-- Replace the slot_chat RLS policy with a SECURITY DEFINER helper.
-- Realtime evaluates RLS for every broadcast row; cross-table EXISTS in
-- a policy can fail silently in that path. A function returning bool works.

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

grant execute on function public.can_access_slot_chat(uuid) to authenticated;

-- Rewrite policies
drop policy if exists slot_chat_read on slot_chat;
create policy slot_chat_read on slot_chat
  for select using (public.can_access_slot_chat(slot_id));

drop policy if exists slot_chat_write on slot_chat;
create policy slot_chat_write on slot_chat
  for insert with check (
    auth.uid() = sender_id
    and public.can_access_slot_chat(slot_id)
  );
