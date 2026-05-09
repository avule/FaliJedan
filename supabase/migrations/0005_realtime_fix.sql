-- Ensure realtime publication includes the three tables we subscribe to.
-- Wrapped individually so a failure on one doesn't skip the others.

do $$ begin
  alter publication supabase_realtime add table slots;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table slot_chat;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table applications;
exception when duplicate_object then null; end $$;

-- Verify — should return 3 rows
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and tablename in ('slots', 'slot_chat', 'applications')
order by tablename;
