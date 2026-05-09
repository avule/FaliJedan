-- INSERT doesn't go through realtime; inline EXISTS works fine and is
-- more transparent than wrapping in a SECURITY DEFINER function.

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
