-- Discount coupon infrastructure: the owner creates codes (percentage or
-- fixed amount, with optional usage limit and expiry) in Configurações;
-- clients apply them during booking. Redemptions are logged separately from
-- the coupon row so uses_count is auditable, not just an incrementing
-- counter with no history.
create table coupons (
  id              uuid primary key default extensions.uuid_generate_v4(),
  code            text not null unique,
  discount_type   text not null check (discount_type = any (array['percentage','fixed'])),
  discount_value  numeric not null check (discount_value > 0),
  max_uses        integer,
  uses_count      integer not null default 0,
  expires_at      date,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table coupon_redemptions (
  id               uuid primary key default extensions.uuid_generate_v4(),
  coupon_id        uuid not null references coupons(id),
  appointment_id   uuid not null references appointments(id),
  discount_amount  numeric not null,
  created_at       timestamptz not null default now()
);
create index coupon_redemptions_coupon_id_idx on coupon_redemptions(coupon_id);

alter table coupons enable row level security;
alter table coupon_redemptions enable row level security;
create policy coupons_admin_all on coupons for all using ((select auth.role()) = 'service_role');
create policy coupon_redemptions_admin_all on coupon_redemptions for all using ((select auth.role()) = 'service_role');
