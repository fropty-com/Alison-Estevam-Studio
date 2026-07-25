-- Generic rate limiter for the public mutable routes (booking creation,
-- cancel, reschedule, confirm) that had zero abuse protection — flagged in
-- the audit as "no route has an attempt limit, allowing automated fake
-- bookings or code scanning". One row per key (IP+route), fixed window,
-- self-overwriting on reset so the table stays bounded (no cron cleanup
-- needed, unlike a row-per-hit log).

create table if not exists rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        integer not null default 0
);

alter table rate_limits enable row level security;

create policy rate_limits_service_role_all on rate_limits
  for all using ((select auth.role()) = 'service_role');

-- Atomic check-and-increment in one statement — a plain read-then-write in
-- application code has a race where two concurrent requests both read
-- count=N and both get allowed past max.
create or replace function check_rate_limit(p_key text, p_window_seconds int, p_max int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
      then now() else rate_limits.window_start end,
    count = case
      when rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
      then 1 else rate_limits.count + 1 end
  returning count into v_count;

  return v_count <= p_max;
end;
$$;

grant execute on function check_rate_limit(text, int, int) to service_role;
