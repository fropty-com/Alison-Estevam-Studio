-- Fixes 3 of the 5 Supabase security advisor warnings found in the Fase 0
-- audit (docs/auditoria/01-inventario-atual.md). The remaining 2 are not
-- SQL-fixable: leaked-password protection is a dashboard/Auth-API toggle,
-- and next_appointment_reference() being SECURITY DEFINER + callable by
-- anon/authenticated is intentional (it only generates a random unique
-- appointment code, no data exposure) — documented via COMMENT instead.

-- 1. function_search_path_mutable: pin search_path so the trigger function
-- can't be hijacked by a search_path manipulated at session level.
alter function public.update_updated_at() set search_path = public;

-- 2. extension_in_public: pg_net is unused by any application code
-- (confirmed via repo-wide grep, zero non-extension pg_depend rows). pg_net
-- doesn't support ALTER EXTENSION ... SET SCHEMA, so recreate it in
-- `extensions` instead of moving it.
drop extension if exists pg_net;
create extension pg_net schema extensions;

-- 3. Document why next_appointment_reference() is intentionally public.
comment on function public.next_appointment_reference() is
  'SECURITY DEFINER intentionally: generates a random unique appointment '
  'reference code by checking against appointments.reference_code. No data '
  'is read or returned beyond the generated code itself, so anon/authenticated '
  'execute access is safe.';
