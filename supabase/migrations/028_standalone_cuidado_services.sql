-- Every booking needs a real services.id (appointments.service_id is
-- NOT NULL, FK to services) - there's no way around that with the current
-- schema. So a cuidado that should be bookable on its own still needs a
-- row here. What went wrong last time: that row showed up in the public
-- Servicos list, mixed in with real haircut/beard packages, because
-- nothing distinguished it. hidden_from_list is that distinction - the
-- general "list every active service" query (landing page + the
-- "Escolha o servico" step) excludes it; only a direct lookup by slug
-- (used exclusively by the Cuidados section's own "Agendar" button) can
-- reach it. The complements-table entry for the same item is untouched
-- and still works exactly as before for the "add-on to a main service"
-- case - this is a second, separate row for a second, separate purpose.

alter table services add column hidden_from_list boolean not null default false;

insert into services (name, slug, description, duration, price, active, position, is_whatsapp_only, hidden_from_list)
values
  ('Design de Sobrancelha', 'design-sobrancelha',  'Definição precisa com navalha. Resultado limpo e natural.', 30, 30.00, true, 10, false, true),
  ('Hidratação Capilar',    'hidratacao-capilar',   'Reposição de nutrientes para cabelos ressecados. Resultado visível já na primeira sessão.', 30, 30.00, true, 11, false, true),
  ('Revitalização Facial',  'revitalizacao-facial', 'Cuidado rápido e eficaz para a pele do rosto. Limpeza e aparência renovada.', 30, 30.00, true, 12, false, true),
  ('Contorno de Barba',     'contorno-barba',       'Acabamento com navalha.', 30, 30.00, true, 13, false, true);
