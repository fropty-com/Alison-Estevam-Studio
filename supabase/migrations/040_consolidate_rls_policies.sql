-- Scopes _admin_all and _public_read policies to disjoint roles so Postgres
-- only evaluates one permissive policy per query instead of both (Fase 6 audit).
alter policy "availability_rules_admin_all" on public.availability_rules to service_role;
alter policy "availability_rules_public_read" on public.availability_rules to anon, authenticated;

alter policy "blocked_admin_all" on public.blocked_periods to service_role;
alter policy "blocked_public_read" on public.blocked_periods to anon, authenticated;

alter policy "complements_admin_all" on public.complements to service_role;
alter policy "complements_public_read" on public.complements to anon, authenticated;

alter policy "service_complements_admin_all" on public.service_complements to service_role;
alter policy "service_complements_public_read" on public.service_complements to anon, authenticated;

alter policy "services_admin_all" on public.services to service_role;
alter policy "services_public_read" on public.services to anon, authenticated;

alter policy "slots_admin_all" on public.time_slots to service_role;
alter policy "slots_public_read" on public.time_slots to anon, authenticated;
