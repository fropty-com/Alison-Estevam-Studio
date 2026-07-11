-- Support "preço a definir" complements (price negotiated at time of service)
alter table complements alter column price drop not null;

-- New complements matching the approved booking-flow prototype
insert into complements (name, slug, description, price, active, position)
values
  ('Contorno de Barba', 'contorno-barba', 'Acabamento com navalha.', 30.00, true, 4),
  ('Acabamento de Cabelo', 'acabamento-cabelo', 'Finalização durante a barba.', null, true, 5);

-- Eligibility mapping, following the same corte/barba component rule already
-- used by the existing 3 complements:
--   Contorno de Barba   -> corte-based services (Cabelo, Corte Feminino, Cabelo e Barba)
--   Acabamento de Cabelo -> barba-based services (Barba, Cabelo e Barba)
insert into service_complements (service_id, complement_id)
select s.id, c.id
from services s, complements c
where c.slug = 'contorno-barba'
  and s.slug in ('cabelo', 'corte-feminino', 'cabelo-e-barba');

insert into service_complements (service_id, complement_id)
select s.id, c.id
from services s, complements c
where c.slug = 'acabamento-cabelo'
  and s.slug in ('barba', 'cabelo-e-barba');
