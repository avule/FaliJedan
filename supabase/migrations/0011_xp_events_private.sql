-- xp istorija je privatna: svako vidi samo svoju.
-- u 0009 je citanje bilo javno (using true), sto je znacilo da bilo ko moze
-- procitati tudju istoriju ako zna player_id. ovdje to zatvaramo.
-- upis i dalje ide samo kroz award_xp (security definer), pa ostaje netaknut.
-- players.id = auth.uid(), pa je provjera direktna.

drop policy if exists xp_events_read on xp_events;
create policy xp_events_read on xp_events
  for select using (auth.uid() = player_id);
