-- sigurnosni fix: skidamo direktan upis na applications i appearances.
-- anon kljuc je javan pa bi igrac inace mogao preko rest-a sam sebe ubaciti
-- kao 'accepted', sam se promovisati sa waitliste ili obrisati svoj red i
-- pokvariti filled_spots. sve izmjene ionako idu kroz security definer rpc.
-- citanje ostaje, pisanje pada. slot_chat ne diramo, on ima ispravnu policy.

-- applications: citanje ostaje, upis samo kroz rpc
drop policy if exists applications_insert_self on applications;
drop policy if exists applications_update on applications;
drop policy if exists applications_delete_self on applications;

-- appearances: citanje ostaje, upis kroz confirm rpc
drop policy if exists appearances_write_organizer on appearances;
drop policy if exists appearances_update_organizer on appearances;
