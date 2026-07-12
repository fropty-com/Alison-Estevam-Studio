-- Waitlist: captured right where a client hits "no slots available" for a
-- given date/service. Notification stays manual (WhatsApp deep link from the
-- admin panel) since there's no WhatsApp Business API integration yet.
create table waitlist_entries (
  id             uuid primary key default extensions.uuid_generate_v4(),
  client_id      uuid not null references clients(id),
  service_id     uuid not null references services(id),
  preferred_date date not null,
  note           text,
  status         text not null default 'waiting'
                 check (status = any (array['waiting', 'notified', 'resolved', 'cancelled'])),
  created_at     timestamptz not null default now(),
  notified_at    timestamptz
);

create index waitlist_entries_date_status_idx on waitlist_entries(preferred_date, status);

alter table waitlist_entries enable row level security;
create policy waitlist_entries_admin_all on waitlist_entries for all using ((select auth.role()) = 'service_role');
