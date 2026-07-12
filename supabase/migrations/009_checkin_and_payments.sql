-- Check-in/check-out timestamps + discount on appointments, and a real
-- payments module (method, fee, net amount) to back the barbeiro's
-- checkout flow and future financial reports.

alter table appointments
  add column checked_in_at  timestamptz,
  add column started_at     timestamptz,
  add column checked_out_at timestamptz,
  add column discount       numeric default 0;

alter table appointments drop constraint appointments_status_check;
alter table appointments add constraint appointments_status_check
  check (status = any (array['pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show']));

create table payment_fee_settings (
  id              uuid primary key default extensions.uuid_generate_v4(),
  method          text not null unique check (method = any (array['cash', 'pix', 'debit_card', 'credit_card', 'courtesy'])),
  fee_percentage  numeric not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

insert into payment_fee_settings (method, fee_percentage) values
  ('cash',        0),
  ('pix',         0),
  ('debit_card',  1.99),
  ('credit_card', 3.49),
  ('courtesy',    0);

create table payments (
  id              uuid primary key default extensions.uuid_generate_v4(),
  appointment_id  uuid not null references appointments(id),
  method          text not null check (method = any (array['cash', 'pix', 'debit_card', 'credit_card', 'courtesy'])),
  gross_amount    numeric not null,
  fee_percentage  numeric not null default 0,
  fee_amount      numeric not null default 0,
  net_amount      numeric not null,
  paid_at         timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index payments_appointment_id_idx on payments(appointment_id);

alter table payment_fee_settings enable row level security;
alter table payments enable row level security;

create policy payment_fee_settings_admin_all on payment_fee_settings
  for all using ((select auth.role()) = 'service_role');

create policy payments_admin_all on payments
  for all using ((select auth.role()) = 'service_role');
