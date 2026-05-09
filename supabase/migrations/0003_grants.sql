-- Grant table-level privileges so RLS policies can take effect.
-- Without these, Postgres rejects access before RLS is even checked.

grant usage on schema public to anon, authenticated;

-- Read access for everyone (RLS still filters rows)
grant select on all tables in schema public to anon, authenticated;

-- Write access only for logged-in users (RLS enforces ownership)
grant insert, update, delete on all tables in schema public to authenticated;

-- Sequences (for serial PK on countries/cities)
grant usage, select on all sequences in schema public to anon, authenticated;

-- Apply same defaults to any future tables/sequences
alter default privileges in schema public
  grant select on tables to anon, authenticated;

alter default privileges in schema public
  grant insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
