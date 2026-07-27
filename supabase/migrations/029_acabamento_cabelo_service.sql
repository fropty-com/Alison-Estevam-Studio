-- 'Acabamento de Cabelo' was the one complement with no fixed price
-- (complements.price is null for it) - unlike the other 4 cuidados, it
-- was left out of the standalone-bookable set since services.price is
-- NOT NULL and there was nothing to put there. price_negotiable marks a
-- service whose price is quoted over WhatsApp rather than shown as a
-- number; is_whatsapp_only already means it skips the calendar entirely
-- and redirects there, same mechanism Horário Exclusivo uses.

alter table services add column price_negotiable boolean not null default false;

insert into services (name, slug, description, duration, price, active, position, is_whatsapp_only, hidden_from_list, price_negotiable)
values (
  'Acabamento de Cabelo', 'acabamento-cabelo', 'Finalização durante a barba.',
  30, 0, true, 14, true, true, true
);
