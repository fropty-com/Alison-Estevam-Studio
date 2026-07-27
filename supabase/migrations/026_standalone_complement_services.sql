-- Complements (Design de Sobrancelha, Hidratação Capilar, Revitalização
-- Facial, Contorno de Barba) previously only existed as optional add-ons
-- tied to a main service (Cabelo, Barba, etc.) via service_complements —
-- a client who wanted only, say, the eyebrow design had no way to book
-- that alone. Each one now also exists as its own row in `services`, so
-- it shows up in the normal service picker (landing page + booking flow)
-- as a standalone, independently bookable 30-min visit — with no
-- complements of its own, keeping it a simple, exclusive booking.
-- The original complement mechanism (as an add-on to a main service) is
-- untouched.

insert into services (name, slug, description, duration, price, active, position, is_whatsapp_only)
values
  ('Design de Sobrancelha', 'design-sobrancelha',   'Definição precisa com navalha. Resultado limpo e natural.', 30, 30.00, true, 6, false),
  ('Hidratação Capilar',    'hidratacao-capilar',    'Reposição de nutrientes para cabelos ressecados. Resultado visível já na primeira sessão.', 30, 30.00, true, 7, false),
  ('Revitalização Facial',  'revitalizacao-facial',  'Cuidado rápido e eficaz para a pele do rosto. Limpeza e aparência renovada.', 30, 30.00, true, 8, false),
  ('Contorno de Barba',     'contorno-barba',        'Acabamento com navalha.', 30, 30.00, true, 9, false);
