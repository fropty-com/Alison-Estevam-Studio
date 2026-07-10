-- ═══════════════════════════════════════════════════════════
-- Complements + pricing snapshot on appointments
-- Migration: 003_complements_and_pricing
-- ═══════════════════════════════════════════════════════════

-- ── Services: flag for WhatsApp-only services (e.g. Horário Exclusivo) ──
ALTER TABLE services ADD COLUMN is_whatsapp_only BOOLEAN NOT NULL DEFAULT FALSE;

-- ── Complements (Cuidados) ────────────────────────────────
CREATE TABLE complements (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  price       NUMERIC(8,2) NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE,
  position    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Service ↔ Complement mapping (which complements a service offers) ──
CREATE TABLE service_complements (
  service_id    UUID NOT NULL REFERENCES services(id)    ON DELETE CASCADE,
  complement_id UUID NOT NULL REFERENCES complements(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, complement_id)
);

-- ── Appointment ↔ Complement (chosen at booking time, price snapshot) ──
CREATE TABLE appointment_complements (
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  complement_id  UUID NOT NULL REFERENCES complements(id)  ON DELETE RESTRICT,
  price          NUMERIC(8,2) NOT NULL, -- price snapshot at booking time
  PRIMARY KEY (appointment_id, complement_id)
);

-- ── Pricing snapshot on appointments (protects against future price changes) ──
ALTER TABLE appointments ADD COLUMN service_price     NUMERIC(8,2) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN complements_price  NUMERIC(8,2) NOT NULL DEFAULT 0;
ALTER TABLE appointments ADD COLUMN total_price        NUMERIC(8,2) NOT NULL DEFAULT 0;

-- ─────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────
CREATE INDEX idx_service_complements_service         ON service_complements(service_id);
CREATE INDEX idx_appointment_complements_appointment  ON appointment_complements(appointment_id);
CREATE INDEX idx_complements_active                   ON complements(active, position);

-- ─────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE complements              ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_complements      ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_complements  ENABLE ROW LEVEL SECURITY;

-- Complements: public read active, admin write
CREATE POLICY "complements_public_read"
  ON complements FOR SELECT USING (active = TRUE);

CREATE POLICY "complements_admin_all"
  ON complements FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- Service ↔ complement mapping: public read (no sensitive data), admin write
CREATE POLICY "service_complements_public_read"
  ON service_complements FOR SELECT USING (true);

CREATE POLICY "service_complements_admin_all"
  ON service_complements FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- Appointment complements: admin only (always written via service role from the API)
CREATE POLICY "appointment_complements_admin_all"
  ON appointment_complements FOR ALL
  USING ((SELECT auth.role()) = 'service_role');

-- ─────────────────────────────────────────────────────────
-- PERF FIX — re-evaluated auth.role() on existing admin policies
-- (flagged by the security/performance advisor; wrap in a subselect
-- so Postgres evaluates it once instead of per row)
-- ─────────────────────────────────────────────────────────
ALTER POLICY "services_admin_all"            ON services            USING ((SELECT auth.role()) = 'service_role');
ALTER POLICY "slots_admin_all"               ON time_slots          USING ((SELECT auth.role()) = 'service_role');
ALTER POLICY "appointments_admin_all"        ON appointments        USING ((SELECT auth.role()) = 'service_role');
ALTER POLICY "clients_admin_all"             ON clients             USING ((SELECT auth.role()) = 'service_role');
ALTER POLICY "blocked_admin_all"             ON blocked_periods     USING ((SELECT auth.role()) = 'service_role');
ALTER POLICY "availability_rules_admin_all"  ON availability_rules  USING ((SELECT auth.role()) = 'service_role');
