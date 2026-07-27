-- Revert 025_dedupe_services.sql: it deactivated the WRONG side of the
-- duplicate pair. The June-12 rows (Corte de Cabelo, Barba Completa,
-- Cabelo e Barba R$100/90min) have no dedicated photo asset and zero
-- historical appointments - they were the stale leftover, never the
-- "original". The July-10 rows (Cabelo, Barba, Cabelo e Barba
-- R$110/120min) have real photos in public/images (servico-cabelo.jpg
-- etc, matching their slugs exactly) and every real appointment on
-- record. Putting the June rows back live took the photos away.

update appointments set service_id = 'da6695a3-8a1b-49c5-a3cb-b1a772acb412'
  where service_id = 'f71aec86-64a1-4b71-96ef-513bfac311dc';
update appointments set service_id = '84c88e6b-f2ce-46d0-bf45-6e79822684ad'
  where service_id = '53346b11-392f-4cf0-90e5-56f68b442cc3';
update appointments set service_id = 'd55ca5cd-4968-41c2-921a-644f5b0e3d01'
  where service_id = '2cde1c4a-1031-43f5-8877-f7d5036199d5';

update service_complements set service_id = 'da6695a3-8a1b-49c5-a3cb-b1a772acb412'
  where service_id = 'f71aec86-64a1-4b71-96ef-513bfac311dc';
update service_complements set service_id = '84c88e6b-f2ce-46d0-bf45-6e79822684ad'
  where service_id = '53346b11-392f-4cf0-90e5-56f68b442cc3';
update service_complements set service_id = 'd55ca5cd-4968-41c2-921a-644f5b0e3d01'
  where service_id = '2cde1c4a-1031-43f5-8877-f7d5036199d5';

update services set active = true where id in (
  'da6695a3-8a1b-49c5-a3cb-b1a772acb412',
  '84c88e6b-f2ce-46d0-bf45-6e79822684ad',
  'd55ca5cd-4968-41c2-921a-644f5b0e3d01'
);
update services set active = false where id in (
  'f71aec86-64a1-4b71-96ef-513bfac311dc',
  '53346b11-392f-4cf0-90e5-56f68b442cc3',
  '2cde1c4a-1031-43f5-8877-f7d5036199d5'
);

-- Revert 026_standalone_complement_services.sql entirely: cuidados
-- (Design de Sobrancelha, Hidratacao Capilar, Revitalizacao Facial,
-- Contorno de Barba) are a separate concept from services with their
-- own section/images on the landing page (CuidadosSection, complements
-- table) - duplicating them into `services` mixed the two categories
-- together in the Servicos list. Zero appointments reference them
-- (created moments ago), safe to delete outright.

delete from services where slug in (
  'design-sobrancelha', 'hidratacao-capilar', 'revitalizacao-facial', 'contorno-barba'
);
