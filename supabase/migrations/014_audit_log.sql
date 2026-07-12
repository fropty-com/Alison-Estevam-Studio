-- Audit trail for admin actions: who cancelled an appointment, who edited a
-- price or fee, who changed the team. actor_name is denormalized at write
-- time so the log stays readable even if a staff member is later removed
-- (actor_id would otherwise dangle once the auth.users row is gone).
create table audit_log (
  id          uuid primary key default extensions.uuid_generate_v4(),
  actor_id    uuid references auth.users(id),
  actor_name  text not null,
  action      text not null,
  target_type text not null,
  target_id   text,
  summary     text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_created_at_idx on audit_log(created_at desc);
create index audit_log_target_idx on audit_log(target_type, target_id);

alter table audit_log enable row level security;
create policy audit_log_admin_all on audit_log for all using ((select auth.role()) = 'service_role');
