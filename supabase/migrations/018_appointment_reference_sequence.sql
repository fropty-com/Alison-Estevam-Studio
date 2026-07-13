-- Reference codes were generated from count(*) of appointments, which
-- breaks the moment any row is ever deleted (test cleanup, or an admin
-- removing a cancelled appointment): the count drops below the highest
-- sequence number already used, and the next generated code collides
-- with an existing one (unique constraint violation on booking).
-- A real sequence is monotonic regardless of deletions and safe under
-- concurrent requests, unlike a count-then-insert read.
do $$
declare
  next_seq int;
begin
  select coalesce(max(substring(reference_code from '(\d+)$')::int), 0) + 1 into next_seq
  from appointments;

  execute format('create sequence if not exists appointment_reference_seq start with %s', next_seq);
end $$;

-- security definer: PostgREST calls this as anon/authenticated/service_role,
-- none of which own the sequence — without this the call fails with
-- "permission denied for sequence appointment_reference_seq".
create or replace function next_appointment_reference()
returns text
language sql
security definer
set search_path = public
as $$
  select 'AE-' || extract(year from now())::text || '-' || lpad(nextval('appointment_reference_seq')::text, 4, '0');
$$;

grant usage, select on sequence appointment_reference_seq to anon, authenticated, service_role;
grant execute on function next_appointment_reference() to anon, authenticated, service_role;
