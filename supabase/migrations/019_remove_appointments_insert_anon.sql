-- ═══════════════════════════════════════════════════════════
-- Remove the public INSERT policy on appointments
-- Migration: 019_remove_appointments_insert_anon
-- ═══════════════════════════════════════════════════════════
--
-- appointments_insert_anon (002_rls_policies.sql) had WITH CHECK (true),
-- letting anyone with the public anon key insert arbitrary rows directly
-- against the Supabase REST API — bypassing availability checks, pricing,
-- the WhatsApp-only service rule, everything. The real booking flow
-- (POST /api/appointments, createManualAppointment) always uses the
-- service-role client, which bypasses RLS entirely, so this policy served
-- no legitimate purpose.

DROP POLICY IF EXISTS "appointments_insert_anon" ON appointments;
