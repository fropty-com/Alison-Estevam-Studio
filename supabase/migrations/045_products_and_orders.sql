-- Loja de produtos cosméticos (Fase 1 — catálogo + admin). Schema completo
-- para as 4 fases (products é a única tabela usada nesta fase; shipping_rates,
-- orders, order_items, order_payments e a extensão de coupon_redemptions são
-- fundação para as Fases 2-4, fixadas agora para manter a arquitetura coerente).

create table products (
  id                uuid primary key default extensions.uuid_generate_v4(),
  slug              text not null unique,
  name              text not null,
  category          text not null check (category = any (array['shampoo','condicionador','pomada','locao','pente'])),
  description       text not null default '',
  price             numeric not null check (price > 0),
  compare_at_price  numeric check (compare_at_price is null or compare_at_price > price),
  stock_quantity    integer not null default 0 check (stock_quantity >= 0),
  image_url         text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table shipping_rates (
  id          uuid primary key default extensions.uuid_generate_v4(),
  label       text not null,
  state       text,
  price       numeric not null check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Bearer token para as rotas públicas do pedido (confirmação, acompanhamento)
-- na Fase 3 — mesmo motivo e mesmo alfabeto sem ambiguidade visual do
-- next_appointment_reference() (ver migration 020_random_reference_code):
-- um código sequencial seria trivialmente enumerável.
create or replace function next_order_reference()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text;
  tries int := 0;
begin
  loop
    code := 'AE-' || (
      select string_agg(substr(alphabet, (floor(random() * length(alphabet)))::int + 1, 1), '')
      from generate_series(1, 8)
    );
    exit when not exists (select 1 from orders where reference_code = code);
    tries := tries + 1;
    if tries > 20 then
      raise exception 'next_order_reference: could not find a unique code';
    end if;
  end loop;
  return code;
end;
$$;

grant execute on function next_order_reference() to service_role;

create table orders (
  id                  uuid primary key default extensions.uuid_generate_v4(),
  reference_code      text not null unique,
  client_id           uuid references clients(id),
  status              text not null default 'aguardando_pagamento'
                        check (status = any (array[
                          'aguardando_pagamento','pago','preparando',
                          'enviado','pronto_retirada','concluido','cancelado'
                        ])),
  fulfillment_method  text not null check (fulfillment_method = any (array['envio','retirada'])),
  shipping_address    jsonb,
  shipping_rate_id    uuid references shipping_rates(id),
  shipping_cost       numeric not null default 0,
  subtotal            numeric not null,
  discount_amount     numeric not null default 0,
  total               numeric not null,
  coupon_id           uuid references coupons(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table order_items (
  id          uuid primary key default extensions.uuid_generate_v4(),
  order_id    uuid not null references orders(id),
  product_id  uuid not null references products(id),
  quantity    integer not null check (quantity > 0),
  unit_price  numeric not null,
  created_at  timestamptz not null default now()
);

-- Separado de `payments` (100% amarrado a atendimento presencial de balcão)
-- porque carrega campos específicos do gateway de pagamento online que não
-- existem no fluxo manual: provider_payment_id para reconciliar o webhook.
create table order_payments (
  id                    uuid primary key default extensions.uuid_generate_v4(),
  order_id              uuid not null references orders(id),
  method                text not null check (method = any (array['pix','debit_card','credit_card'])),
  provider              text not null default 'mercado_pago',
  provider_payment_id   text,
  status                text not null check (status = any (array['pending','approved','rejected','refunded'])),
  amount                numeric not null,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

-- Amplia coupon_redemptions (antes só appointment_id) para também valer para
-- pedidos de produto, sem duplicar cadastro/gestão de cupom.
alter table coupon_redemptions alter column appointment_id drop not null;
alter table coupon_redemptions add column order_id uuid references orders(id);
alter table coupon_redemptions add constraint coupon_redemptions_target_check
  check ((appointment_id is not null) <> (order_id is not null));

create index idx_orders_client_id on public.orders (client_id);
create index idx_orders_shipping_rate_id on public.orders (shipping_rate_id);
create index idx_orders_coupon_id on public.orders (coupon_id);
create index idx_order_items_order_id on public.order_items (order_id);
create index idx_order_items_product_id on public.order_items (product_id);
create index idx_order_payments_order_id on public.order_payments (order_id);
create index idx_coupon_redemptions_order_id on public.coupon_redemptions (order_id);

alter table products enable row level security;
alter table shipping_rates enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_payments enable row level security;

create policy "products_public_read" on products for select to anon, authenticated using (active = true);
create policy "products_admin_all" on products for all to service_role using ((select auth.role()) = 'service_role');

create policy "shipping_rates_public_read" on shipping_rates for select to anon, authenticated using (active = true);
create policy "shipping_rates_admin_all" on shipping_rates for all to service_role using ((select auth.role()) = 'service_role');

create policy "orders_admin_all" on orders for all to service_role using ((select auth.role()) = 'service_role');
create policy "order_items_admin_all" on order_items for all to service_role using ((select auth.role()) = 'service_role');
create policy "order_payments_admin_all" on order_payments for all to service_role using ((select auth.role()) = 'service_role');
