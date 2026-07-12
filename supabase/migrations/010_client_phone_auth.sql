-- Phone-based OTP auth for the client area. Kept entirely separate from
-- Supabase Auth (used only by the admin, email/password) to avoid the
-- session/service-role interference bug fixed in migration 009's commit.

create table otp_codes (
  id           uuid primary key default extensions.uuid_generate_v4(),
  phone        text not null,
  code_hash    text not null,
  expires_at   timestamptz not null,
  attempts     integer not null default 0,
  consumed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index otp_codes_phone_idx on otp_codes(phone);

alter table otp_codes enable row level security;

create policy otp_codes_admin_all on otp_codes
  for all using ((select auth.role()) = 'service_role');

alter table clients
  add column consent_whatsapp boolean not null default false,
  add column consent_terms    boolean not null default false,
  add column last_login_at    timestamptz;
