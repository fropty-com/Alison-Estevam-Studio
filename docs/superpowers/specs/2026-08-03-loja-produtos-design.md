# Loja de produtos cosméticos (shampoo, condicionador, pomada, loção, pente de barba)

## Contexto

Pedido do usuário, inspirado em https://bymen.com.br/collections/kits (inspecionado ao vivo: grade de cards com preço + preço Pix + parcelamento, página de produto com galeria/estoque/descrição em abas, carrinho e checkout padrão de e-commerce). O objetivo é trazer essa mecânica para o site da Alison Estevam Studio, mas só para os 5 tipos de produto pedidos, com o design já estabelecido da marca (Cormorant/Montserrat/Lora, carvão/dourado/offwhite), pagamento online real (Pix/débito/crédito), envio ou retirada com cálculo de frete, cupom de desconto, e a receita de produto entrando classificada no Faturamento.

Este é um módulo grande — decompomos em 4 fases sequenciais, cada uma com sua própria spec → plano → implementação, como já feito para Financeiro, Operacional etc. nesta base. **Este documento cobre a Fase 1 em detalhe** (a próxima a ser implementada) **e as Fases 2–4 em visão geral**, para manter a arquitetura coerente entre elas — cada fase será redetalhada na sua vez.

## Decisões de escopo (via perguntas de esclarecimento)

- **Gateway de pagamento: Mercado Pago.** Processa Pix, débito e crédito. Usaremos o **Payment Brick** (componente embutido do SDK oficial) em vez de redirecionar o cliente para um checkout hospedado — mantém a marca visível na tela de pagamento, e o cartão é tokenizado no navegador do cliente pela própria Mercado Pago, então o servidor nunca vê dado de cartão (fora do escopo de PCI compliance).
- **Frete por tabela fixa, não API de transportadora.** O barbeiro cadastra faixas (rótulo + UF + valor) em vez de integrar Correios/PAC/SEDEX — mais simples, sem dependência externa, suficiente para o volume esperado.
- **Produtos sem variação — SKU único por produto.** Diferente do site de referência (que tem linhas/fragrâncias/tamanhos), aqui cada produto cadastrado é uma coisa vendível só. Mantém o cadastro simples; se precisar de outra versão, cadastra-se como produto novo.
- **Estoque por quantidade**, não só ativo/inativo — cada venda desconta automaticamente, esgotando sozinho quando chega a zero (mostra aviso de "últimas unidades" na vitrine, como o site de referência).
- **Uma foto por produto**, sem galeria — suficiente para 5 produtos com embalagem padrão, mais simples de cadastrar.
- **Vitrine em grade de cards** (não lista vertical como Serviços/Cuidados hoje) — convenção de e-commerce, escaneia mais rápido, tema aplicado com as cores/tipografia da marca.
- **Página própria por produto** (`/produtos/[slug]`), não modal — URL compartilhável, melhor SEO, mais espaço para descrição.
- **Cupom reaproveitado**: a tabela `coupons` já existente (usada em agendamentos) passa a valer também para pedidos de produto, sem duplicar cadastro/gestão.

## Fase 1 — Catálogo + Admin (detalhado)

### Modelo de dados

Módulo novo, isolado das tabelas de agendamento — só reaproveita `clients` e `coupons`. Toda a Fase 1 só precisa de `products`; as demais tabelas abaixo (`shipping_rates`, `orders`, `order_items`, `order_payments`) são fundação para as Fases 2–4 e entram na mesma migration para já fixar o schema completo, mas ficam sem uso até lá.

```sql
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
  label       text not null,       -- "Capital", "Interior SP", "Outros estados"
  state       text,                -- UF; null = tarifa padrão/fallback
  price       numeric not null check (price >= 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table orders (
  id                  uuid primary key default extensions.uuid_generate_v4(),
  reference_code      text not null unique,   -- mesmo padrão AE-... dos agendamentos
  client_id           uuid references clients(id),
  status              text not null default 'aguardando_pagamento'
                        check (status = any (array[
                          'aguardando_pagamento','pago','preparando',
                          'enviado','pronto_retirada','concluido','cancelado'
                        ])),
  fulfillment_method  text not null check (fulfillment_method = any (array['envio','retirada'])),
  shipping_address    jsonb,               -- null quando retirada
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
  unit_price  numeric not null,   -- preço no momento da venda, não muda retroativamente
  created_at  timestamptz not null default now()
);

-- separado do `payments` (100% amarrado a atendimento presencial) porque
-- carrega campos específicos do gateway online que não existem para
-- pagamento manual de balcão.
create table order_payments (
  id                    uuid primary key default extensions.uuid_generate_v4(),
  order_id              uuid not null references orders(id),
  method                text not null check (method = any (array['pix','debit_card','credit_card'])),
  provider              text not null default 'mercado_pago',
  provider_payment_id   text,        -- id da Mercado Pago, para reconciliar via webhook
  status                text not null check (status = any (array['pending','approved','rejected','refunded'])),
  amount                numeric not null,
  paid_at               timestamptz,
  created_at            timestamptz not null default now()
);

-- amplia coupon_redemptions (hoje só aceita appointment_id) para também
-- valer para pedidos de produto, sem duplicar tabela de cupons.
alter table coupon_redemptions alter column appointment_id drop not null;
alter table coupon_redemptions add column order_id uuid references orders(id);
alter table coupon_redemptions add constraint coupon_redemptions_target_check
  check ((appointment_id is not null) <> (order_id is not null));
```

RLS: mesmo padrão do resto do projeto — `for all using ((select auth.role()) = 'service_role')` em todas as tabelas novas; leitura pública de `products` (só os `active = true`) via uma policy própria, já que a vitrine (Fase 2) precisa listar sem autenticação.

### Admin — `/admin/produtos`

Novo item no `AdminNav` ("Produtos", `ownerOnly: false` — controlar estoque é operacional, não financeiro, então toda a equipe deve poder cadastrar/editar, no mesmo espírito de `/admin/servicos` e `/admin/agenda`).

Estrutura da página, espelhando `/admin/servicos` (que já lista serviços como cards com toggle e edição):

- Cards de estatística do mês no topo (produtos ativos, unidades em estoque total, valor total em estoque) — mesmo padrão dos cards de `/admin/servicos`.
- Grade de cards, um por produto: foto, nome, categoria, preço (com "de/por" se tiver `compare_at_price`), quantidade em estoque, toggle ativo/inativo, botão editar.
- Modal de cadastro/edição: nome, categoria (select), descrição, preço, preço "de" (opcional), quantidade em estoque, upload de foto (reaproveita o componente de upload já usado no perfil do admin), ativo/inativo.
- Faixas de frete: aba própria ("Frete") dentro de `/admin/produtos`, ao lado da aba de produtos — lista editável de `shipping_rates` no padrão `CouponRow`/`PaymentFeeSettingRow` já existentes (linha com rótulo, UF, preço, toggle ativo, editar/excluir).

### Testes

Sem produtos ainda para vender (Fase 2+), então o teste desta fase é só CRUD: criar produto, editar, desativar/reativar, upload de foto, estoque não aceita negativo, cadastrar/editar/excluir faixa de frete. Validação manual via conta QA temporária, como já é padrão nesta base.

## Fase 2 — Vitrine do cliente (visão geral)

- Novo item de menu público "Produtos" → `/produtos`: grade de cards (tema carvão/dourado/Cormorant já validado com o usuário), filtro por categoria, "adicionar ao carrinho" direto no card.
- `/produtos/[slug]`: foto, nome, preço, aviso de estoque baixo, seletor de quantidade, descrição, "Adicionar ao carrinho".
- Carrinho: painel lateral (mesmo padrão do `ClientDetailDrawer` do admin), contador de itens sempre visível no menu.

## Fase 3 — Carrinho + Checkout + Pagamento (visão geral)

- `/checkout` em página única: retirada ou endereço de entrega (calcula frete pela tabela da Fase 1) → cupom → resumo (subtotal + frete − desconto) → Payment Brick da Mercado Pago (Pix mostra QR code inline, débito/crédito tokeniza no navegador).
- Webhook da Mercado Pago atualiza `order_payments.status` e `orders.status` (aguardando_pagamento → pago) via `provider_payment_id`.
- Confirmação: tela com código do pedido + e-mail de confirmação, mesmo padrão dos e-mails de agendamento (`src/lib/email/*`).

## Fase 4 — Pós-venda + Métricas (visão geral)

- Painel de pedidos no admin (lista + avanço de status: pago → preparando → enviado/pronto_retirada → concluído), no padrão de ação dos botões de check-in/checkout de agendamento.
- Receita de produto entra como categoria própria (separada de serviço) nos cards e gráficos já existentes em `/admin/faturamento` e `/admin/financeiro`.

## Riscos e dependências externas

- **Conta Mercado Pago**: o usuário precisa criar/ter uma conta de vendedor na Mercado Pago e gerar credenciais (public key + access token) antes da Fase 3 — isso não pode ser feito por automação, é uma ação do usuário fora deste projeto.
- **Webhook em produção**: o webhook de confirmação de pagamento só é testável de verdade em produção (URL pública), como já é o caso do cron de lembretes e do checkout de agendamento existente — testes locais na Fase 3 cobrem a lógica de cálculo/estado, não a chamada real da Mercado Pago.
