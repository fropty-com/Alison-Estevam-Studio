-- Adds indexes on foreign key columns that lacked coverage (Fase 6 audit).
create index if not exists idx_appointment_complements_complement_id on public.appointment_complements (complement_id);
create index if not exists idx_appointments_service_id on public.appointments (service_id);
create index if not exists idx_audit_log_actor_id on public.audit_log (actor_id);
create index if not exists idx_coupon_redemptions_appointment_id on public.coupon_redemptions (appointment_id);
create index if not exists idx_loyalty_redemptions_redeemed_by on public.loyalty_redemptions (redeemed_by);
create index if not exists idx_reviews_service_id on public.reviews (service_id);
create index if not exists idx_service_complements_complement_id on public.service_complements (complement_id);
create index if not exists idx_time_slots_blocked_period_id on public.time_slots (blocked_period_id);
create index if not exists idx_waitlist_entries_client_id on public.waitlist_entries (client_id);
create index if not exists idx_waitlist_entries_service_id on public.waitlist_entries (service_id);
