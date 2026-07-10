-- ═══════════════════════════════════════════════════════════
-- Deactivate legacy placeholder services from 001_initial_schema
-- Migration: 005_deactivate_legacy_services
--
-- These rows (different slugs than the real catalog seeded in
-- 004_seed_real_data) survived in the live database even though the
-- table appeared empty in row-count estimates. Deactivating instead
-- of deleting to avoid breaking any FK reference from old test data.
-- ═══════════════════════════════════════════════════════════
UPDATE services SET active = false
WHERE slug IN ('corte-cabelo', 'barba-completa', 'cabelo-barba', 'tratamento-capilar');
