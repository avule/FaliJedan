-- fix za 0009. kolona "level int" se sudarala sa postojecim enumom "level"
-- (nivo igre iz 0001) pa nije ni napravljena, a award_xp je pokusavao da upise
-- broj u enum kolonu i puklo bi cim se prvi xp dodijeli.
-- rjesenje: level se ne cuva, racuna se iz xp-a u kodu. award_xp dira samo xp.

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

  update players set xp = xp + p_amount where id = p_player;
end;
$$;
