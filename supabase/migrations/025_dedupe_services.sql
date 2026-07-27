-- A reseed on 2026-07-10 duplicated 3 services that already existed since
-- 2026-06-12, reusing the same "position" as the originals (which is why
-- they rendered back-to-back, looking identical/near-identical, on both
-- the landing page and the booking screen):
--   'Cabelo' (R$70/60min)         duplicates 'Corte de Cabelo' (R$60/60min)
--   'Barba' (R$70/60min)          duplicates 'Barba Completa' (R$60/60min)
--   'Cabelo e Barba' (R$110/120min) duplicates 'Cabelo e Barba' (R$100/90min)
-- Repoint any appointment/complement links from the duplicates to the
-- original service before deactivating the duplicates, so nothing is lost.

update appointments set service_id = 'f71aec86-64a1-4b71-96ef-513bfac311dc'
  where service_id = 'da6695a3-8a1b-49c5-a3cb-b1a772acb412';
update appointments set service_id = '53346b11-392f-4cf0-90e5-56f68b442cc3'
  where service_id = '84c88e6b-f2ce-46d0-bf45-6e79822684ad';
update appointments set service_id = '2cde1c4a-1031-43f5-8877-f7d5036199d5'
  where service_id = 'd55ca5cd-4968-41c2-921a-644f5b0e3d01';

update service_complements set service_id = 'f71aec86-64a1-4b71-96ef-513bfac311dc'
  where service_id = 'da6695a3-8a1b-49c5-a3cb-b1a772acb412';
update service_complements set service_id = '53346b11-392f-4cf0-90e5-56f68b442cc3'
  where service_id = '84c88e6b-f2ce-46d0-bf45-6e79822684ad';
update service_complements set service_id = '2cde1c4a-1031-43f5-8877-f7d5036199d5'
  where service_id = 'd55ca5cd-4968-41c2-921a-644f5b0e3d01';

update services set active = false
  where id in (
    'da6695a3-8a1b-49c5-a3cb-b1a772acb412',
    '84c88e6b-f2ce-46d0-bf45-6e79822684ad',
    'd55ca5cd-4968-41c2-921a-644f5b0e3d01'
  );
