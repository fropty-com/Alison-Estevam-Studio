-- Client-facing "Perfil" area: profile photo, LGPD soft-delete, a
-- human-friendly receipt number on payments, and a new reviews table.
-- Loyalty and payment history are reused as-is (already tested, computed
-- from real data) — nothing duplicated here.

alter table clients
  add column avatar_url text,
  add column deleted_at timestamptz;

-- Auto-incrementing receipt number for the client-facing receipt view —
-- friendlier than exposing the payment's uuid. Backfills existing rows.
alter table payments
  add column receipt_number bigserial;

create table reviews (
  id             uuid primary key default extensions.uuid_generate_v4(),
  client_id      uuid not null references clients(id),
  appointment_id uuid not null references appointments(id) unique,
  service_id     uuid not null references services(id),
  rating         integer not null check (rating between 1 and 5),
  comment        text,
  status         text not null default 'published' check (status = any (array['published', 'hidden'])),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index reviews_client_id_idx on reviews(client_id);

alter table reviews enable row level security;
create policy reviews_admin_all on reviews for all using ((select auth.role()) = 'service_role');
