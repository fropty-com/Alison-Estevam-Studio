-- reference_code was a monotonic sequence (AE-2026-0001, AE-2026-0002, ...)
-- used as the sole bearer token for the public cancel/reschedule/confirm/GET
-- endpoints (/api/appointments/[code]/*). Sequential codes are trivially
-- enumerable — anyone could walk AE-2026-0001..9999 and read or cancel any
-- client's appointment (name, WhatsApp, service, time), no other auth
-- required. The code is only ever reached through a link (email/WhatsApp),
-- never typed by hand, so there's no UX cost to making it unguessable:
-- 8 chars from a 32-symbol unambiguous alphabet is ~1e12 combinations.

drop function if exists next_appointment_reference();

create or replace function next_appointment_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  -- no 0/O, 1/I/L to avoid visual ambiguity when a code IS read aloud
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  tries int := 0;
begin
  loop
    code := 'AE-' || (
      select string_agg(substr(alphabet, (floor(random() * length(alphabet)))::int + 1, 1), '')
      from generate_series(1, 8)
    );
    exit when not exists (select 1 from appointments where reference_code = code);
    tries := tries + 1;
    if tries > 20 then
      raise exception 'next_appointment_reference: could not find a unique code';
    end if;
  end loop;
  return code;
end;
$$;

grant execute on function next_appointment_reference() to anon, authenticated, service_role;

-- The old sequence is no longer used by the function above; drop it.
drop sequence if exists appointment_reference_seq;
