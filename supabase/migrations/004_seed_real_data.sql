-- ═══════════════════════════════════════════════════════════
-- Seed — real services, availability windows, and complements
-- Migration: 004_seed_real_data
-- Replaces the placeholder demo values from 001_initial_schema.
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────────────────────
INSERT INTO services (name, slug, description, duration, price, is_whatsapp_only, active, position) VALUES
  ('Cabelo',            'cabelo',            'Corte com técnica precisa, respeitando o rosto e o estilo. Inclui lavagem e finalização.', 60,  70.00,  FALSE, TRUE, 1),
  ('Barba',              'barba',             'Modelagem e acabamento com navalha, com barboterapia a vapor para preparar a pele.',        60,  70.00,  FALSE, TRUE, 2),
  ('Cabelo e Barba',     'cabelo-e-barba',    'A experiência completa: corte e barba em um único atendimento.',                            120, 110.00, FALSE, TRUE, 3),
  ('Corte Feminino',     'corte-feminino',    'Corte personalizado, com lavagem e finalização.',                                           60,  100.00, FALSE, TRUE, 4),
  ('Horário Exclusivo',  'horario-exclusivo', 'Atendimento fora do expediente para quem busca flexibilidade.',                             60,  110.00, TRUE,  TRUE, 5)
ON CONFLICT (slug) DO UPDATE SET
  name              = EXCLUDED.name,
  description       = EXCLUDED.description,
  duration          = EXCLUDED.duration,
  price             = EXCLUDED.price,
  is_whatsapp_only  = EXCLUDED.is_whatsapp_only,
  active            = EXCLUDED.active,
  position          = EXCLUDED.position;

-- ─────────────────────────────────────────────────────────
-- AVAILABILITY RULES
-- Seg-sex: 10h-12h e 15h-20h (pausa de almoço 12h-15h)
-- Sábado: 8h-15h, sem pausa
-- Domingo: fechado (sem regra — bloqueado em código via BOOKING.blockedWeekdays)
-- ─────────────────────────────────────────────────────────
DELETE FROM availability_rules; -- replace the old 09:00-17:00 placeholder windows

INSERT INTO availability_rules (weekday, start_time, end_time, active) VALUES
  (1, '10:00', '12:00', TRUE), -- Segunda manhã
  (1, '15:00', '20:00', TRUE), -- Segunda tarde/noite
  (2, '10:00', '12:00', TRUE), -- Terça manhã
  (2, '15:00', '20:00', TRUE), -- Terça tarde/noite
  (3, '10:00', '12:00', TRUE), -- Quarta manhã
  (3, '15:00', '20:00', TRUE), -- Quarta tarde/noite
  (4, '10:00', '12:00', TRUE), -- Quinta manhã
  (4, '15:00', '20:00', TRUE), -- Quinta tarde/noite
  (5, '10:00', '12:00', TRUE), -- Sexta manhã
  (5, '15:00', '20:00', TRUE), -- Sexta tarde/noite
  (6, '08:00', '15:00', TRUE); -- Sábado, sem pausa

-- ─────────────────────────────────────────────────────────
-- COMPLEMENTS (Cuidados)
-- ─────────────────────────────────────────────────────────
INSERT INTO complements (name, slug, description, price, active, position) VALUES
  ('Design de Sobrancelha', 'design-sobrancelha',  'Definição precisa com navalha. Resultado limpo e natural.',                  30.00, TRUE, 1),
  ('Hidratação Capilar',    'hidratacao-capilar',  'Reposição de nutrientes para cabelos ressecados. Resultado visível já na primeira sessão.', 30.00, TRUE, 2),
  ('Revitalização Facial',  'revitalizacao-facial','Cuidado rápido e eficaz para a pele do rosto. Limpeza e aparência renovada.', 30.00, TRUE, 3)
ON CONFLICT (slug) DO UPDATE SET
  name        = EXCLUDED.name,
  description = EXCLUDED.description,
  price       = EXCLUDED.price,
  active      = EXCLUDED.active,
  position    = EXCLUDED.position;

-- ─────────────────────────────────────────────────────────
-- SERVICE ↔ COMPLEMENT MAPPING
-- Cabelo            → Hidratação, Sobrancelha
-- Barba             → Revitalização, Sobrancelha
-- Cabelo e Barba    → Hidratação, Revitalização, Sobrancelha
-- Corte Feminino    → Hidratação, Sobrancelha
-- Horário Exclusivo → nenhum (fluxo é só WhatsApp)
-- ─────────────────────────────────────────────────────────
INSERT INTO service_complements (service_id, complement_id)
SELECT s.id, c.id FROM services s, complements c
WHERE (s.slug, c.slug) IN (
  ('cabelo',         'hidratacao-capilar'),
  ('cabelo',         'design-sobrancelha'),
  ('barba',          'revitalizacao-facial'),
  ('barba',          'design-sobrancelha'),
  ('cabelo-e-barba', 'hidratacao-capilar'),
  ('cabelo-e-barba', 'revitalizacao-facial'),
  ('cabelo-e-barba', 'design-sobrancelha'),
  ('corte-feminino', 'hidratacao-capilar'),
  ('corte-feminino', 'design-sobrancelha')
)
ON CONFLICT DO NOTHING;
