-- Run this if 0001 finished schema but seed didn't insert.
insert into countries (name, code) values
  ('Bosna i Hercegovina', 'BA'),
  ('Srbija', 'RS'),
  ('Hrvatska', 'HR'),
  ('Crna Gora', 'ME'),
  ('Sjeverna Makedonija', 'MK')
on conflict (code) do nothing;

insert into cities (country_id, name)
select c.id, x.name from countries c
join (values
  ('BA', 'Sarajevo'), ('BA', 'Banja Luka'), ('BA', 'Mostar'), ('BA', 'Tuzla'), ('BA', 'Zenica'),
  ('RS', 'Beograd'), ('RS', 'Novi Sad'), ('RS', 'Niš'), ('RS', 'Kragujevac'), ('RS', 'Subotica'),
  ('HR', 'Zagreb'), ('HR', 'Split'), ('HR', 'Rijeka'), ('HR', 'Osijek'), ('HR', 'Zadar'),
  ('ME', 'Podgorica'), ('ME', 'Nikšić'), ('ME', 'Budva'), ('ME', 'Bar'),
  ('MK', 'Skoplje'), ('MK', 'Bitola'), ('MK', 'Kumanovo'), ('MK', 'Tetovo')
) x(code, name) on c.code = x.code
on conflict (country_id, name) do nothing;

-- Verify
select c.code, c.name, count(ci.id) as cities
from countries c left join cities ci on ci.country_id = c.id
group by c.id, c.code, c.name
order by c.name;
