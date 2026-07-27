-- Which complements were offered as an add-on varied inconsistently by
-- service (Corte de Cabelo and Corte Feminino were each missing 2 of the 5
-- cuidados; only Cabelo e Barba already had all 5) - so the same "Add a
-- complement" step showed a different, incomplete list depending on which
-- main service the client had picked. Cross-join every active, real
-- (non-hidden) bookable service with every active complement so the set
-- offered is always the same 5, everywhere.

insert into service_complements (service_id, complement_id)
select s.id, c.id
from services s
cross join complements c
where s.active and not s.hidden_from_list and not s.is_whatsapp_only
  and c.active
on conflict (service_id, complement_id) do nothing;
